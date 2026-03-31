const express = require('express');
const router  = express.Router();

// GET /api/weather?lat=&lon=
router.get('/weather', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });

  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lon,
    hourly: 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,weathercode,windspeed_10m,winddirection_10m,relativehumidity_2m,uv_index',
    wind_speed_unit:     'mph',
    temperature_unit:    'fahrenheit',
    precipitation_unit:  'inch',
    timezone:            'auto',
    forecast_days:       16,
  });

  try {
    const upstream = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!upstream.ok) throw new Error('Upstream error');
    res.json(await upstream.json());
  } catch {
    res.status(502).json({ error: 'Weather service unavailable' });
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

module.exports = router;
