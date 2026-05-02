const express = require('express');
const router  = express.Router();

const HOURLY_FORECAST_FIELDS = 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,weathercode,windspeed_10m,winddirection_10m,relativehumidity_2m,uv_index';
const HOURLY_ARCHIVE_FIELDS = 'temperature_2m,apparent_temperature,precipitation,weathercode,windspeed_10m,winddirection_10m,relativehumidity_2m,uv_index';

// GET /api/weather?lat=&lon=&date=YYYY-MM-DD
router.get('/weather', async (req, res) => {
  const { lat, lon, date } = req.query;
  if (!lat || !lon || !date) return res.status(400).json({ error: 'lat, lon, and date are required' });

  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lon,
    start_date: date,
    end_date: date,
    hourly: HOURLY_FORECAST_FIELDS,
    wind_speed_unit:     'mph',
    temperature_unit:    'fahrenheit',
    precipitation_unit:  'inch',
    timezone:            'auto',
  });

  try {
    const upstream = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!upstream.ok) throw new Error('Upstream error');
    res.json(await upstream.json());
  } catch {
    res.status(502).json({ error: 'Weather service unavailable' });
  }
});

// GET /api/past-weather?lat=&lon=&date=YYYY-MM-DD
router.get('/past-weather', async (req, res) => {
  const { lat, lon, date } = req.query;
  if (!lat || !lon || !date) return res.status(400).json({ error: 'lat, lon, and date are required' });

  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lon,
    start_date: date,
    end_date: date,
    hourly: HOURLY_ARCHIVE_FIELDS,
    temperature_unit:   'fahrenheit',
    wind_speed_unit:    'mph',
    precipitation_unit: 'inch',
    timezone:           'auto',
  });

  try {
    const upstream = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`);
    if (!upstream.ok) throw new Error('Upstream error');
    const data = await upstream.json();

    const precip = data.hourly?.precipitation || [];
    data.source = 'past';
    data.hourly.precipitation_probability = precip.map(inches => inches > 0.01 ? 100 : 0);
    res.json(data);
  } catch {
    res.status(502).json({ error: 'Historical weather service unavailable' });
  }
});

// GET /api/geocode?q=&limit=
router.get('/geocode', async (req, res) => {
  const { q, limit = 6 } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=${limit}&addressdetails=1`;
    const upstream = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'marathon-weather-app/1.0',
      },
    });
    res.json(await upstream.json());
  } catch {
    res.status(502).json({ error: 'Geocoding service unavailable' });
  }
});

// GET /api/climate?lat=&lon=&date=YYYY-MM-DD
// Returns hour-by-hour averages for the past 5 years on the given date
router.get('/climate', async (req, res) => {
  const { lat, lon, date } = req.query;
  if (!lat || !lon || !date) return res.status(400).json({ error: 'lat, lon, and date required' });

  const [, month, day] = date.split('-');
  const currentYear = new Date().getFullYear();
  const candidateYears = [1, 2, 3, 4, 5].map(i => currentYear - i);

  const yearResults = await Promise.all(candidateYears.map(async year => {
    const d = `${year}-${month}-${day}`;
    const params = new URLSearchParams({
      latitude: lat, longitude: lon,
      start_date: d, end_date: d,
      hourly: HOURLY_ARCHIVE_FIELDS,
      temperature_unit:   'fahrenheit',
      wind_speed_unit:    'mph',
      precipitation_unit: 'inch',
      timezone:           'auto',
    });
    try {
      const r = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`);
      if (!r.ok) return null;
      const data = await r.json();
      return data.hourly?.time?.length === 24 ? { year, data } : null;
    } catch { return null; }
  }));

  const valid = yearResults.filter(Boolean);
  if (!valid.length) return res.status(502).json({ error: 'No historical data available' });

  const datasets = valid.map(v => v.data);
  const n = datasets.length;

  const avgField = field => Array.from({ length: 24 }, (_, h) => {
    const vals = datasets.map(d => d.hourly[field]?.[h] ?? 0);
    return vals.reduce((s, v) => s + v, 0) / n;
  });

  const modeField = field => Array.from({ length: 24 }, (_, h) => {
    const vals = datasets.map(d => d.hourly[field]?.[h] ?? 0);
    const counts = {};
    vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    return Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
  });

  // Rain frequency: % of years that had measurable rain at this hour
  const rainFreq = Array.from({ length: 24 }, (_, h) => {
    const rainy = datasets.filter(d => (d.hourly.precipitation?.[h] ?? 0) > 0.01).length;
    return Math.round((rainy / n) * 100);
  });

  // Generate time strings for the requested date
  const times = Array.from({ length: 24 }, (_, h) =>
    `${date}T${String(h).padStart(2, '0')}:00`
  );

  res.json({
    source: 'climate',
    climate_years: valid.map(v => v.year),
    climate_yearly: valid.map(({ year, data }) => ({
      year,
      hourly: {
        time: data.hourly.time,
        temperature_2m: data.hourly.temperature_2m,
        apparent_temperature: data.hourly.apparent_temperature,
      },
    })),
    hourly: {
      time:                      times,
      temperature_2m:            avgField('temperature_2m'),
      apparent_temperature:      avgField('apparent_temperature'),
      precipitation_probability: rainFreq,
      precipitation:             avgField('precipitation'),
      weathercode:               modeField('weathercode'),
      windspeed_10m:             avgField('windspeed_10m'),
      winddirection_10m:         avgField('winddirection_10m'),
      relativehumidity_2m:       avgField('relativehumidity_2m'),
      uv_index:                  avgField('uv_index'),
    },
  });
});

module.exports = router;
