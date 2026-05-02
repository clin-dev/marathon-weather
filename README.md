# Marathon Weather

Race-day weather for marathon runners. Users search a seeded marathon catalog, and the app uses the race's stored date, location, and start time to show the right weather window.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Database Setup

```bash
createdb marathon_weather
```

If `createdb` is not in your PATH:

```bash
psql -U postgres -c "CREATE DATABASE marathon_weather;"
```

Copy the environment template:

```bash
cp .env.example .env
```

Set:

```env
DATABASE_URL=postgresql://localhost:5432/marathon_weather
PORT=3000
```

The `marathons` table is created and seeded automatically on server start from `server/data/marathons.js`.

## Run

```bash
npm install
npm run dev
```

For a plain server without file watching:

```bash
npm start
```

Open http://localhost:3000.

## Project Structure

```text
marathon-weather/
├── public/                  Static frontend served by Express
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── weather.js       Scoring, weather labels, helper functions
│       ├── api.js           Backend fetch wrappers
│       ├── ui.js            DOM rendering
│       └── app.js           State, event wiring, orchestration
├── server/
│   ├── data/marathons.js    Seed data for the marathon catalog
│   ├── index.js             Express app entry point
│   ├── db.js                PostgreSQL pool, table init, catalog seeding
│   └── routes/
│       ├── marathons.js     Marathon catalog search
│       └── weather.js       Forecast, past weather, climate-average APIs
├── .env.example
├── package.json
└── package-lock.json
```

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/marathons?q=&limit=` | Search the seeded marathon catalog |
| `GET` | `/api/marathons/:slug` | Fetch one marathon by slug |
| `GET` | `/api/weather?lat=&lon=&date=` | Fetch forecast data for a race date within the forecast window |
| `GET` | `/api/past-weather?lat=&lon=&date=` | Fetch archived weather for past race dates |
| `GET` | `/api/climate?lat=&lon=&date=` | Fetch 5-year historical averages and year-by-year temperatures |

## Weather Modes

- Past marathon date: archived weather from Open-Meteo Archive API
- Marathon date within forecast window: forecast from Open-Meteo Forecast API
- Marathon date beyond forecast window: historical averages from the past 5 matching calendar dates

The UI does not allow arbitrary date selection. The selected marathon record owns the date and start time.
