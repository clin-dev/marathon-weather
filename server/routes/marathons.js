const express = require('express');
const router = express.Router();
const { pool } = require('../db');

function normalizeRace(row) {
  return {
    ...row,
    race_date: row.race_date instanceof Date
      ? row.race_date.toISOString().slice(0, 10)
      : row.race_date,
  };
}

// GET /api/marathons?q=
router.get('/', async (req, res) => {
  const { q = '', limit = 10 } = req.query;
  const parsedLimit = parseInt(limit, 10);
  const safeLimit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 10 : parsedLimit, 1), 25);

  try {
    const params = [];
    let where = '';
    if (q.trim()) {
      params.push(`%${q.trim()}%`);
      where = 'WHERE name ILIKE $1 OR city ILIKE $1';
    } else {
      where = 'WHERE race_date >= CURRENT_DATE';
    }

    params.push(safeLimit);
    const limitParam = params.length;

    const { rows } = await pool.query(
      `SELECT id, slug, name, city, location_name, lat, lon, race_date, start_hour
       FROM marathons
       ${where}
       ORDER BY race_date ASC, name ASC
       LIMIT $${limitParam}`,
      params
    );

    res.json(rows.map(normalizeRace));
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/marathons/:slug
router.get('/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, name, city, location_name, lat, lon, race_date, start_hour
       FROM marathons
       WHERE slug = $1`,
      [req.params.slug]
    );

    if (!rows.length) return res.status(404).json({ error: 'Marathon not found' });
    res.json(normalizeRace(rows[0]));
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
