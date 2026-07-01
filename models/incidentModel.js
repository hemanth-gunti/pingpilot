const pool = require('../config/db');

// Opens a new incident when a monitor goes down
async function openIncident(monitorId, cause) {
  const { rows } = await pool.query(
    `INSERT INTO incidents (monitor_id, cause) VALUES ($1, $2) RETURNING *`,
    [monitorId, cause || null]
  );
  return rows[0];
}

// Closes the most recent open incident when a monitor comes back up
async function resolveOpenIncident(monitorId) {
  await pool.query(
    `UPDATE incidents SET resolved_at = NOW()
     WHERE monitor_id = $1 AND resolved_at IS NULL`,
    [monitorId]
  );
}

async function getIncidents(monitorId) {
  const { rows } = await pool.query(
    `SELECT * FROM incidents WHERE monitor_id = $1 ORDER BY started_at DESC`,
    [monitorId]
  );
  return rows;
}

async function getLastResolvedIncident(monitorId) {
  const { rows } = await pool.query(
    `SELECT * FROM incidents 
     WHERE monitor_id = $1 AND resolved_at IS NOT NULL 
     ORDER BY resolved_at DESC LIMIT 1`,
    [monitorId]
  );
  return rows[0];
}

function formatDuration(startedAt, resolvedAt) {
  const diffMs = new Date(resolvedAt) - new Date(startedAt);
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${totalSeconds % 60}s`;
  return `${totalSeconds}s`;
}

module.exports = { openIncident, resolveOpenIncident, getIncidents, getLastResolvedIncident, formatDuration };