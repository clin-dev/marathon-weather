const { Pool } = require('pg');
const marathons = require('./data/marathons');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS marathons (
      id            SERIAL PRIMARY KEY,
      slug          TEXT             NOT NULL UNIQUE,
      name          TEXT             NOT NULL,
      city          TEXT             NOT NULL,
      location_name TEXT             NOT NULL,
      lat           DOUBLE PRECISION NOT NULL,
      lon           DOUBLE PRECISION NOT NULL,
      race_date     DATE             NOT NULL,
      start_hour    INTEGER          NOT NULL,
      updated_at    TIMESTAMPTZ      DEFAULT NOW()
    )
  `);

  for (const race of marathons) {
    await pool.query(
      `INSERT INTO marathons
        (slug, name, city, location_name, lat, lon, race_date, start_hour)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        city = EXCLUDED.city,
        location_name = EXCLUDED.location_name,
        lat = EXCLUDED.lat,
        lon = EXCLUDED.lon,
        race_date = EXCLUDED.race_date,
        start_hour = EXCLUDED.start_hour,
        updated_at = NOW()`,
      [
        race.slug,
        race.name,
        race.city,
        race.location_name,
        race.lat,
        race.lon,
        race.race_date,
        race.start_hour,
      ]
    );
  }
}

module.exports = { pool, init };
