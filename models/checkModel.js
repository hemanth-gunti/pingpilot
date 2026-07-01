const pool = require('../config/db');

async function recordCheck({ monitorId, status, statusCode, responseTimeMs, errorMessage }) {
  const { rows } = await pool.query(
    `INSERT INTO checks (monitor_id, status, status_code, response_time_ms, error_message)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [monitorId, status, statusCode || null, responseTimeMs || null, errorMessage || null]
  );
  return rows[0];
}

// Uptime % over the last N days
async function getUptimePercentage(monitorId, days = 30) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'up') AS up_count,
       COUNT(*) AS total_count
     FROM checks
     WHERE monitor_id = $1 AND checked_at >= NOW() - INTERVAL '${days} days'`,
    [monitorId]
  );
  const { up_count, total_count } = rows[0];
  if (Number(total_count) === 0) return 100;
  return Number(((up_count / total_count) * 100).toFixed(2));
}

// Daily uptime % for the last N days — used to draw the uptime graph
async function getDailyUptimeHistory(monitorId, days = 30) {
  const { rows } = await pool.query(
    `SELECT
       date_trunc('day', checked_at) AS day,
       COUNT(*) FILTER (WHERE status = 'up') AS up_count,
       COUNT(*) AS total_count
     FROM checks
     WHERE monitor_id = $1 AND checked_at >= NOW() - INTERVAL '${days} days'
     GROUP BY day
     ORDER BY day ASC`,
    [monitorId]
  );
  return rows.map((r) => ({
    day: r.day,
    uptimePercent: Number(((r.up_count / r.total_count) * 100).toFixed(2)),
  }));
}

// Average response time per day — used to draw the response time graph
async function getDailyResponseTime(monitorId, days = 30) {
  const { rows } = await pool.query(
    `SELECT
       date_trunc('day', checked_at) AS day,
       ROUND(AVG(response_time_ms)) AS avg_ms
     FROM checks
     WHERE monitor_id = $1
       AND status = 'up'
       AND checked_at >= NOW() - INTERVAL '${days} days'
     GROUP BY day
     ORDER BY day ASC`,
    [monitorId]
  );
  return rows.map((r) => ({
    day: r.day,
    avgMs: Number(r.avg_ms),
  }));
}

module.exports = {
  recordCheck,
  getUptimePercentage,
  getDailyUptimeHistory,
  getDailyResponseTime,
};