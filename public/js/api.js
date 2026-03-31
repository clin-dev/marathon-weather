// All network calls go through our backend

async function searchLocations(query) {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&limit=6`);
  return res.json();
}

// Returns { name, lat, lon } or null if not found
async function geocodeLocation(query) {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&limit=1`);
  const data = await res.json();
  if (!data.length) return null;
  return {
    name: data[0].display_name,
    lat:  parseFloat(data[0].lat),
    lon:  parseFloat(data[0].lon),
  };
}

async function fetchWeather(lat, lon) {
  const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error('Weather API error');
  return res.json();
}

// ── Race persistence ──────────────────────────────────────────────────────────

async function fetchRaces() {
  const res = await fetch('/api/races');
  return res.json();
}

async function saveRace(name, locationName, lat, lon) {
  const res = await fetch('/api/races', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, location_name: locationName, lat, lon }),
  });
  if (!res.ok) throw new Error('Failed to save race');
  return res.json();
}

async function deleteRace(id) {
  await fetch(`/api/races/${id}`, { method: 'DELETE' });
}
