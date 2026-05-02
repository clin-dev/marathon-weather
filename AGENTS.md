# AGENTS.md

This file provides guidance to Codex and other coding agents when working in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Development server with nodemon
npm start         # Production-style local server
```

No build step is required. Express serves `public/` directly.

## Environment

Create PostgreSQL database `marathon_weather`, then copy `.env.example` to `.env`:

```env
DATABASE_URL=postgresql://localhost:5432/marathon_weather
PORT=3000
```

`server/db.js` creates and seeds the `marathons` table on startup from `server/data/marathons.js`.

## Architecture

### Backend

- `server/index.js` - Express entry point, static serving, API route mounting
- `server/db.js` - PostgreSQL pool, schema creation, marathon seed upsert
- `server/data/marathons.js` - Seed data for marathon catalog records
- `server/routes/marathons.js` - `GET /api/marathons` search and `GET /api/marathons/:slug`
- `server/routes/weather.js` - Open-Meteo forecast, archive, and climate-average proxy endpoints

### Frontend

The browser app lives only under `public/`.

| File | Role |
|---|---|
| `public/index.html` | Single page shell |
| `public/css/styles.css` | App styling |
| `public/js/app.js` | State, event wiring, weather-mode selection |
| `public/js/api.js` | Backend fetch wrappers |
| `public/js/ui.js` | DOM rendering |
| `public/js/weather.js` | Pure weather scoring and helper functions |

### Data Flow

User searches marathons -> `app.js` -> `api.js` -> `/api/marathons` -> PostgreSQL catalog.

After a marathon is selected, the app uses the stored race date:

- Past date -> `/api/past-weather`
- Date within forecast window -> `/api/weather`
- Date beyond forecast window -> `/api/climate`

The UI intentionally does not expose a date picker. Race date and start time come from the selected marathon record.

## Domain Notes

- Race window is `start_hour` through `start_hour + 6`.
- Scoring lives in `public/js/weather.js`.
- Historical climate mode returns both averaged hourly data and year-by-year temperature rows.
- Marathon seed data is currently hardcoded; production-quality data would need an import/admin workflow or external source.
