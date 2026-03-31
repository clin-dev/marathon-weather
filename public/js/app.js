// State & orchestration

let selectedLocation = null;
let searchTimeout    = null;

const locationInput = document.getElementById('locationInput');

// ── Init ──────────────────────────────────────────────────────────────────────
(function init() {
  const dateInput = document.getElementById('raceDateInput');
  const today = new Date();

  const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
  const sat = new Date(today);
  sat.setDate(today.getDate() + daysUntilSaturday);
  dateInput.value = toLocalDateString(sat);

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 15);
  dateInput.max = toLocalDateString(maxDate);
  dateInput.min = toLocalDateString(today);

  loadSavedRaces();
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

// ── Saved races ───────────────────────────────────────────────────────────────
async function loadSavedRaces() {
  try {
    const races = await fetchRaces();
    renderSavedRaces(races);
  } catch {
    // silently fail — saved races are non-critical
  }
}

// Event delegation for race chip clicks
document.getElementById('raceChips').addEventListener('click', async e => {
  const chip = e.target.closest('.race-chip');
  if (!chip) return;

  if (e.target.classList.contains('chip-delete')) {
    await deleteRace(chip.dataset.id);
    loadSavedRaces();
  } else {
    selectedLocation = {
      name: decodeURIComponent(chip.dataset.location),
      lat:  parseFloat(chip.dataset.lat),
      lon:  parseFloat(chip.dataset.lon),
    };
    locationInput.value = chip.querySelector('.chip-name').textContent;
    getForecast();
  }
});

async function handleSaveRace() {
  const nameInput = document.getElementById('raceNameInput');
  const saveMsg   = document.getElementById('saveMsg');
  const btn       = document.getElementById('saveRaceBtn');

  const name = nameInput.value.trim();
  if (!name) { saveMsg.textContent = 'Enter a race name first.'; return; }
  if (!selectedLocation) { saveMsg.textContent = 'No location selected.'; return; }

  btn.disabled = true;
  try {
    await saveRace(name, selectedLocation.name, selectedLocation.lat, selectedLocation.lon);
    saveMsg.className = 'save-msg success';
    saveMsg.textContent = 'Race saved!';
    nameInput.value = '';
    loadSavedRaces();
    setTimeout(() => { saveMsg.textContent = ''; saveMsg.className = 'save-msg'; }, 3000);
  } catch {
    saveMsg.className = 'save-msg error';
    saveMsg.textContent = 'Could not save. Try again.';
  } finally {
    btn.disabled = false;
  }
}

// ── Forecast ──────────────────────────────────────────────────────────────────
async function getForecast() {
  const dateStr = document.getElementById('raceDateInput').value;
  if (!dateStr) { showStatus('Please pick a race date.', true); return; }

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
