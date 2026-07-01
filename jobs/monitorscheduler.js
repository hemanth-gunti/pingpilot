const axios = require('axios');
const monitorModel = require('../models/monitorModel');
const checkModel = require('../models/checkModel');
const cron = require('node-cron');
const incidentModel = require('../models/incidentModel');
const { sendAlertEmail } = require('../utils/mailer');

// Tracks the last time each monitor was checked (key: monitor id, value: timestamp)
const lastChecked = {};

async function pingUrl(url) {
  const start = Date.now();
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true,
    });
    const responseTimeMs = Date.now() - start;
    const isUp = res.status >= 200 && res.status < 400;
    return { isUp, statusCode: res.status, responseTimeMs, errorMessage: null };
  } catch (err) {
    const responseTimeMs = Date.now() - start;
    return { isUp: false, statusCode: null, responseTimeMs, errorMessage: err.code || err.message };
  }
}

async function checkMonitor(monitor) {
  const { isUp, statusCode, responseTimeMs, errorMessage } = await pingUrl(monitor.url);
  const newStatus = isUp ? 'up' : 'down';

  await checkModel.recordCheck({
    monitorId: monitor.id,
    status: newStatus,
    statusCode,
    responseTimeMs,
    errorMessage,
  });

  if (monitor.current_status !== newStatus) {
    console.log(`Status changed for "${monitor.name}": ${monitor.current_status} → ${newStatus}`);
    await monitorModel.updateMonitorStatus(monitor.id, newStatus);

    if (newStatus === 'down') {
      await incidentModel.openIncident(monitor.id, errorMessage);
      console.log(`🔴 Incident opened for "${monitor.name}"`);

      await sendAlertEmail({
        monitorName: monitor.name,
        url: monitor.url,
        status: 'down',
        detail: errorMessage || (statusCode ? `HTTP ${statusCode}` : null),
        downtimeDuration: null,
      });

    } else if (monitor.current_status === 'down') {
      await incidentModel.resolveOpenIncident(monitor.id);
      console.log(`🟢 Incident resolved for "${monitor.name}"`);

      const resolved = await incidentModel.getLastResolvedIncident(monitor.id);
      const duration = resolved
        ? incidentModel.formatDuration(resolved.started_at, resolved.resolved_at)
        : null;

      await sendAlertEmail({
        monitorName: monitor.name,
        url: monitor.url,
        status: 'up',
        detail: null,
        downtimeDuration: duration,
      });
    }

  } else {
    console.log(`"${monitor.name}" checked: ${newStatus} (${responseTimeMs}ms)`);
  }
}

async function runAllChecks() {
  const monitors = await monitorModel.getAllMonitors();
  const now = Date.now();

  for (const monitor of monitors) {
    const intervalMs = (monitor.check_interval || 60) * 1000;
    const last = lastChecked[monitor.id] || 0;

    // Only ping this monitor if its interval has elapsed
    if (now - last >= intervalMs) {
      lastChecked[monitor.id] = now;
      await checkMonitor(monitor).catch((e) =>
        console.error(`Check failed for monitor ${monitor.id}:`, e.message)
      );
    }
  }
}

function startScheduler() {
  // Base tick every 10 seconds — checks which monitors are due to be pinged
  cron.schedule('*/10 * * * * *', async () => {
    await runAllChecks();
  });
  console.log('✅ Scheduler started — checking monitors at their individual intervals');
}

module.exports = { runAllChecks, startScheduler };