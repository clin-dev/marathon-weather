const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS races (
      id            SERIAL PRIMARY KEY,
      name          TEXT             NOT NULL,
      location_name TEXT             NOT NULL,
      lat           DOUBLE PRECISION NOT NULL,
      lon           DOUBLE PRECISION NOT NULL,
      start_hour    INTEGER          DEFAULT 8,
      created_at    TIMESTAMPTZ      DEFAULT NOW()
    )
  `);
  // Migrate existing tables that don't have start_hour
  await pool.query(`
    ALTER TABLE races ADD COLUMN IF NOT EXISTS start_hour INTEGER DEFAULT 8
  `);
}

module.exports = { pool, init };
