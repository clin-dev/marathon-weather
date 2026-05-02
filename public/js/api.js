// All network calls go through our backend

async function searchMarathons(query) {
  const res = await fetch(`/api/marathons?q=${encodeURIComponent(query)}&limit=10`);
  if (!res.ok) throw new Error('Marathon search error');
  return res.json();
}

async function fetchUpcomingMarathons() {
  const res = await fetch('/api/marathons?limit=8');
  if (!res.ok) throw new Error('Marathon list error');
  return res.json();
}

async function fetchWeather(lat, lon, date) {
  const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}&date=${date}`);
  if (!res.ok) throw new Error('Weather API error');
  return res.json();
}

async function fetchPastWeather(lat, lon, date) {
  const res = await fetch(`/api/past-weather?lat=${lat}&lon=${lon}&date=${date}`);
  if (!res.ok) throw new Error('Past weather API error');
  return res.json();
}

async function fetchClimate(lat, lon, date) {
  const res = await fetch(`/api/climate?lat=${lat}&lon=${lon}&date=${date}`);
  if (!res.ok) throw new Error('Climate API error');
  return res.json();
}
