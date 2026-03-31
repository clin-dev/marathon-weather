// State & orchestration

let selectedLocation = null;
let searchTimeout = null;

const locationInput = document.getElementById('locationInput');

// ── Init ──────────────────────────────────────────────────────────────────────
(function init() {
  const dateInput = document.getElementById('raceDateInput');
  const today = new Date();

  // Default to next Saturday
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
  const sat = new Date(today);
  sat.setDate(today.getDate() + daysUntilSaturday);
  dateInput.value = toLocalDateString(sat);

  // Limit to 16 days out (Open-Meteo forecast window)
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 15);
  dateInput.max = toLocalDateString(maxDate);
  dateInput.min = toLocalDateString(today);
})();

// ── Autocomplete ──────────────────────────────────────────────────────────────
locationInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  selectedLocation = null;
  const q = locationInput.value.trim();
  if (q.length < 2) { closeAutocomplete(); return; }
  searchTimeout = setTimeout(async () => {
    try {
      const data = await searchLocations(q);
      renderAutocomplete(data, (loc, name) => {
        selectedLocation = loc;
        locationInput.value = name;
        getForecast();
      });
    } catch {
      closeAutocomplete();
    }
  }, 350);
});

locationInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAutocomplete();
  if (e.key === 'Enter')  { closeAutocomplete(); getForecast(); }
});

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) closeAutocomplete();
});

// ── Forecast ──────────────────────────────────────────────────────────────────
async function getForecast() {
  const dateStr = document.getElementById('raceDateInput').value;
  if (!dateStr) { showStatus('Please pick a race date.', true); return; }

  // Geocode if user typed but didn't pick from the autocomplete list
  if (!selectedLocation) {
    const q = locationInput.value.trim();
    if (!q) { showStatus('Please enter a location.', true); return; }
    showStatus('<span class="loader"></span>Finding location…');
    try {
      const loc = await geocodeLocation(q);
      if (!loc) { showStatus('Location not found. Try a more specific address.', true); return; }
      selectedLocation = loc;
    } catch {
      showStatus('Could not reach geocoding service. Check your connection.', true);
      return;
    }
  }

  const btn = document.getElementById('forecastBtn');
  showStatus('<span class="loader"></span>Fetching race-day forecast…');
  btn.disabled = true;

  try {
    const data = await fetchWeather(selectedLocation.lat, selectedLocation.lon);
    renderForecast(data, dateStr, selectedLocation);
  } catch {
    showStatus('Could not fetch weather data. Please try again.', true);
  } finally {
    btn.disabled = false;
  }
}
