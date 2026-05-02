// State & orchestration

let selectedRace = null;
let searchTimeout = null;

const raceInput = document.getElementById('raceInput');

(function init() {
  loadInitialMarathons();
})();

async function loadInitialMarathons() {
  try {
    const races = await fetchUpcomingMarathons();
    renderMarathonSuggestions(races, selectRace);
  } catch {
    // Search still works if the initial suggestions fail.
  }
}

// ── Marathon search autocomplete ─────────────────────────────────────────────
raceInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  selectedRace = null;

  const q = raceInput.value.trim();
  if (q.length < 2) {
    closeAutocomplete();
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      const results = await searchMarathons(q);
      renderAutocomplete(results, selectRace);
    } catch {
      closeAutocomplete();
    }
  }, 200);
});

raceInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAutocomplete();
  if (e.key === 'Enter') {
    closeAutocomplete();
    getForecast();
  }
});

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) closeAutocomplete();
});

function selectRace(race) {
  selectedRace = {
    ...race,
    startHour: race.start_hour,
  };
  raceInput.value = race.name;
  getForecast();
}

// ── Forecast ──────────────────────────────────────────────────────────────────
async function getForecast() {
  if (!selectedRace) {
    showStatus('Please select a marathon from the database.', true);
    return;
  }

  const dateStr = selectedRace.race_date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const raceDate = new Date(dateStr + 'T00:00:00');
  const daysAhead = Math.ceil((raceDate - today) / 864e5);

  const isPast = raceDate < today;
  const isForecast = daysAhead >= 0 && daysAhead <= 16;

  const btn = document.getElementById('forecastBtn');
  const label = isPast
    ? 'Loading past race-day weather…'
    : isForecast
      ? 'Fetching race-day forecast…'
      : 'Loading historical averages…';

  showStatus(`<span class="loader"></span>${label}`);
  btn.disabled = true;

  try {
    const data = isPast
      ? await fetchPastWeather(selectedRace.lat, selectedRace.lon, dateStr)
      : isForecast
        ? await fetchWeather(selectedRace.lat, selectedRace.lon, dateStr)
        : await fetchClimate(selectedRace.lat, selectedRace.lon, dateStr);

    renderForecast(data, dateStr, selectedRace);
  } catch {
    showStatus('Could not fetch weather data. Please try again.', true);
  } finally {
    btn.disabled = false;
  }
}
