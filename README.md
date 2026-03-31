# Marathon Weather

Race-day weather forecasts for marathon runners, with saved races backed by PostgreSQL.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

---

## 1. Install PostgreSQL

### macOS (Homebrew)
```bash
brew install postgresql@16
brew services start postgresql@16
```

### Ubuntu / Debian
```bash
sudo apt update && sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows
Download and run the installer from https://www.postgresql.org/download/windows/
During setup, note the port (default: 5432) and the password you set for the `postgres` user.

---

## 2. Create the database

### macOS / Linux
```bash
createdb marathon_weather
```

If `createdb` isn't in your PATH, use:
```bash
psql -U postgres -c "CREATE DATABASE marathon_weather;"
```

### Windows (in psql or pgAdmin)
```sql
CREATE DATABASE marathon_weather;
```

---

## 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
# Default (no password, local socket — typical for macOS Homebrew installs)
DATABASE_URL=postgresql://localhost:5432/marathon_weather

# With username/password (typical for Linux or Windows installs)
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/marathon_weather

PORT=3000
```

The `races` table is created automatically on first start — no migration step needed.

---

## 4. Install dependencies & run

```bash
npm install
npm run dev      # auto-restarts on file changes (nodemon)
# or
npm start        # production
```

Open http://localhost:3000

---

## Project structure

```
marathon-weather/
├── public/               ← Static frontend (served by Express)
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── weather.js    ← scoring, icons, helpers (pure functions)
│       ├── api.js        ← fetch calls to our backend
│       ├── ui.js         ← DOM rendering
│       └── app.js        ← state, event wiring, orchestration
├── server/
│   ├── index.js          ← Express app entry point
│   ├── db.js             ← pg connection pool + table init
│   └── routes/
│       ├── races.js      ← GET/POST/DELETE /api/races
│       └── weather.js    ← GET /api/weather, GET /api/geocode
├── .env                  ← local config (not committed)
├── .env.example
└── package.json
```

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/races` | List saved races |
| `POST` | `/api/races` | Save a race `{ name, location_name, lat, lon }` |
| `DELETE` | `/api/races/:id` | Delete a saved race |
| `GET` | `/api/weather?lat=&lon=` | Fetch forecast from Open-Meteo |
| `GET` | `/api/geocode?q=&limit=` | Search locations via Nominatim |
