# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Development server with auto-restart (nodemon)
npm start         # Production server
```

No build step — this is served directly as static files + Express.

### Database Setup (required before running)

```bash
createdb marathon_weather          # macOS/Linux: create the database
# Linux with default postgres user:
# psql -U postgres -c "CREATE DATABASE marathon_weather;"
```

The `races` table is auto-created on first server start — no migrations needed.

### Environment

Copy `.env.example` to `.env` and set:
- `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://localhost:5432/marathon_weather`)
- `PORT` — defaults to 3000

## Architecture

### Backend (`server/`)

- `server/index.js` — Express entry point, loads `.env`, mounts routes
- `server/db.js` — `pg` connection pool; auto-creates `races` table on init
- `server/routes/weather.js` — Proxies to Open-Meteo (forecast) and Nominatim (geocoding); no API keys required for either
- `server/routes/races.js` — CRUD for saved races (GET/POST/DELETE `/api/races`)

### Frontend (`public/js/`)

Four files with strict separation of concerns:

| File | Role |
|------|------|
| `app.js` | Global state (`selectedLocation`, `searchTimeout`), event listeners, main orchestration |
| `api.js` | All `fetch` calls to the backend |
| `weather.js` | Pure functions only — WMO code mapping, condition scoring, tips generation |
| `ui.js` | All DOM manipulation — renders forecast cards, hourly grid, autocomplete, tips |

**Data flow:** User input → `app.js` → `api.js` → Express routes → external APIs → `weather.js` (scoring) → `ui.js` (render)

### Key Domain Logic

**Scoring** (`weather.js: analyzeConditions`): Rates conditions Excellent → Good → Fair → Challenging → Tough based on feels-like temperature (ideal 45–55°F), wind, precipitation probability, and humidity. Generates narrative and runner-specific tips.

**Race morning window:** Always 5 AM – 12 PM on the selected race date. Open-Meteo provides 16 days of hourly data.

**Location search:** Debounced 350ms, uses Nominatim with a `User-Agent` header set in `server/routes/weather.js`.

### Database Schema

```sql
CREATE TABLE races (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  location_name TEXT NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lon           DOUBLE PRECISION NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
)
```
