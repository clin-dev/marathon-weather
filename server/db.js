const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS races (
      id          SERIAL PRIMARY KEY,
      name        TEXT             NOT NULL,
      location_name TEXT           NOT NULL,
      lat         DOUBLE PRECISION NOT NULL,
      lon         DOUBLE PRECISION NOT NULL,
      created_at  TIMESTAMPTZ      DEFAULT NOW()
    )
  `);
}

module.exports = { pool, init };
