// State & orchestration

let selectedRace  = null; // { name, city, lat, lon, startHour }
let searchTimeout = null;

const raceInput = document.getElementById('raceInput');

// ── Init ──────────────────────────────────────────────────────────────────────
(function init() {
  const dateInput = document.getElementById('raceDateInput');
  const today = new Date();

  // Default to next Sunday
  const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
  const sun = new Date(today);
  sun.setDate(today.getDate() + daysUntilSunday);
  dateInput.value = toLocalDateString(sun);
  dateInput.min   = toLocalDateString(today);
  // No max — any future date is allowed; beyond 16 days uses historical climate

  loadSavedRaces();
})();

// ── Race search autocomplete ──────────────────────────────────────────────────
raceInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  selectedRace = null;
  const q = raceInput.value.trim();
  if (q.length < 2) { closeAutocomplete(); return; }
  searchTimeout = setTimeout(() => {
    const results = searchMarathons(q);
    renderAutocomplete(results, race => {
      selectedRace = race;
      raceInput.value = race.name;
      getForecast();
    });
  }, 200);
});

raceInput.addEventListener('keydown', e => {
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
    // non-critical
  }
}

document.getElementById('raceChips').addEventListener('click', async e => {
  const chip = e.target.closest('.race-chip');
  if (!chip) return;

  if (e.target.classList.contains('chip-delete')) {
    await deleteRace(chip.dataset.id);
    loadSavedRaces();
  } else {
    selectedRace = {
      name:      chip.querySelector('.chip-name').textContent,
      city:      decodeURIComponent(chip.dataset.location),
      lat:       parseFloat(chip.dataset.lat),
      lon:       parseFloat(chip.dataset.lon),
      startHour: parseInt(chip.dataset.startHour) || 8,
    };
    raceInput.value = selectedRace.name;
    getForecast();
  }
});

async function handleSaveRace() {
  const nameInput = document.getElementById('raceNameInput');
  const saveMsg   = document.getElementById('saveMsg');
  const btn       = document.getElementById('saveRaceBtn');

  const name = nameInput.value.trim();
  if (!name)        { saveMsg.textContent = 'Enter a race name first.'; return; }
  if (!selectedRace){ saveMsg.textContent = 'No race selected.'; return; }

  btn.disabled = true;
  try {
    await saveRace(name, selectedRace.city, selectedRace.lat, selectedRace.lon, selectedRace.startHour);
    saveMsg.className   = 'save-msg success';
    saveMsg.textContent = 'Race saved!';
    nameInput.value     = '';
    loadSavedRaces();
    setTimeout(() => { saveMsg.textContent = ''; saveMsg.className = 'save-msg'; }, 3000);
  } catch {
    saveMsg.className   = 'save-msg error';
    saveMsg.textContent = 'Could not save. Try again.';
  } finally {
    btn.disabled = false;
  }
}

// ── Forecast ──────────────────────────────────────────────────────────────────
async function getForecast() {
  const dateStr = document.getElementById('raceDateInput').value;
  if (!dateStr)     { showStatus('Please pick a race date.', true); return; }
  if (!selectedRace){ showStatus('Please select a marathon from the list.', true); return; }

  // Determine if the date is beyond the 16-day forecast window
  const today      = new Date(); today.setHours(0, 0, 0, 0);
  const raceDate   = new Date(dateStr + 'T00:00:00');
  const daysAhead  = Math.ceil((raceDate - today) / 864e5);
  const isClimate  = daysAhead > 16;

  const btn = document.getElementById('forecastBtn');
  showStatus(`<span class="loader"></span>${isClimate ? 'Loading historical averages…' : 'Fetching race-day forecast…'}`);
  btn.disabled = true;

  try {
    const data = isClimate
      ? await fetchClimate(selectedRace.lat, selectedRace.lon, dateStr)
      : await fetchWeather(selectedRace.lat, selectedRace.lon);
    renderForecast(data, dateStr, selectedRace);
  } catch {
    showStatus('Could not fetch weather data. Please try again.', true);
  } finally {
    btn.disabled = false;
  }
}
