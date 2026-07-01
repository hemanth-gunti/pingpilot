const express = require('express');
const router = express.Router();
const monitorModel = require('../models/monitorModel');
const checkModel = require('../models/checkModel');
const incidentModel = require('../models/incidentModel');
const { ensureAuthenticated } = require('../middleware/auth');

// Dashboard — only the logged-in user's monitors
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  const monitors = await monitorModel.getMonitorsByUser(req.user.id);
  const withUptime = await Promise.all(
    monitors.map(async (m) => ({
      ...m,
      uptime30d: await checkModel.getUptimePercentage(m.id, 30),
    }))
  );
  res.render('dashboard', { monitors: withUptime, user: req.user });
});

// Create a monitor — tied to the logged-in user
router.post('/', ensureAuthenticated, async (req, res) => {
  const { url, name, checkInterval } = req.body;
  if (!url || !name) {
    return res.status(400).json({ error: 'url and name are required' });
  }
  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }
  await monitorModel.createMonitor({
    userId: req.user.id,
    url: normalizedUrl,
    name: name.trim(),
    checkInterval: Number(checkInterval) || 60,
  });
  res.redirect('/api/monitors/dashboard');
});

// Delete a monitor — only if it belongs to the logged-in user
router.post('/:id/delete', ensureAuthenticated, async (req, res) => {
  await monitorModel.deleteMonitor(req.params.id, req.user.id);
  res.redirect('/api/monitors/dashboard');
});

router.get('/:id/stats', async (req, res) => {
  const monitorId = req.params.id;
  const uptime = await checkModel.getUptimePercentage(monitorId, 30);
  const incidents = await incidentModel.getIncidents(monitorId);
  res.json({ uptime30d: uptime, incidents });
});

// Public status page — no login required, anyone with the link can view
router.get('/:id/status-page', async (req, res) => {
  const monitor = await monitorModel.getMonitorById(req.params.id);
  if (!monitor) return res.status(404).send('Monitor not found');

  const uptime30d = await checkModel.getUptimePercentage(monitor.id, 30);
  const history = await checkModel.getDailyUptimeHistory(monitor.id, 30);
  const responseTimeHistory = await checkModel.getDailyResponseTime(monitor.id, 30);
  const incidents = await incidentModel.getIncidents(monitor.id);

  res.render('status', { monitor, uptime30d, history, responseTimeHistory, incidents });
});

// Pause a monitor
router.post('/:id/pause', ensureAuthenticated, async (req, res) => {
  await monitorModel.toggleMonitor(req.params.id, req.user.id, false);
  res.redirect('/api/monitors/dashboard');
});

// Resume a monitor
router.post('/:id/resume', ensureAuthenticated, async (req, res) => {
  await monitorModel.toggleMonitor(req.params.id, req.user.id, true);
  res.redirect('/api/monitors/dashboard');
});

module.exports = router;