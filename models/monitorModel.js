const pool = require('../config/db');

async function createMonitor({ userId, url, name, checkInterval = 60 }) {
  const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  const { rows } = await pool.query(
    `INSERT INTO monitors (user_id, url, name, slug, current_status, check_interval)
     VALUES ($1, $2, $3, $4, 'unknown', $5) RETURNING *`,
    [userId, url, name, slug, checkInterval]
  );
  return rows[0];
}

async function getMonitorsByUser(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM monitors WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function getAllMonitors() {
  const { rows } = await pool.query(
    `SELECT * FROM monitors WHERE is_active = TRUE ORDER BY created_at DESC`
  );
  return rows;
}

async function getMonitorById(id) {
  const { rows } = await pool.query(`SELECT * FROM monitors WHERE id = $1`, [id]);
  return rows[0];
}

async function updateMonitorStatus(id, status) {
  await pool.query(`UPDATE monitors SET current_status = $1 WHERE id = $2`, [status, id]);
}

async function deleteMonitor(id, userId) {
  await pool.query(`DELETE FROM monitors WHERE id = $1 AND user_id = $2`, [id, userId]);
}

async function toggleMonitor(id, userId, isActive) {
  await pool.query(
    `UPDATE monitors SET is_active = $1 WHERE id = $2 AND user_id = $3`,
    [isActive, id, userId]
  );
}

module.exports = {
  createMonitor,
  getMonitorsByUser,
  getAllMonitors,
  getMonitorById,
  updateMonitorStatus,
  deleteMonitor,
  toggleMonitor,
};