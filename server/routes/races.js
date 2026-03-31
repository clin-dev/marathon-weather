const express = require('express');
const router  = express.Router();
const { pool } = require('../db');

// GET /api/races
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM races ORDER BY created_at DESC');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/races
router.post('/', async (req, res) => {
  const { name, location_name, lat, lon } = req.body;
  if (!name || !location_name || lat == null || lon == null) {
    return res.status(400).json({ error: 'name, location_name, lat, and lon are required' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO races (name, location_name, lat, lon) VALUES ($1, $2, $3, $4) RETURNING *',
      [name.trim(), location_name, lat, lon]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/races/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM races WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
