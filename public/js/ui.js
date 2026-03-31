// DOM rendering — no state, no API calls

const autocompleteList = document.getElementById('autocompleteList');

function closeAutocomplete() {
  autocompleteList.classList.remove('open');
}

// onSelect(location, displayName) called when user picks a suggestion
function renderAutocomplete(results, onSelect) {
  if (!results.length) { closeAutocomplete(); return; }
  autocompleteList.innerHTML = '';
  results.forEach(r => {
    const li = document.createElement('li');
    const name = r.display_name.split(',').slice(0, 3).join(',');
    li.innerHTML = `<div>${name}</div><div class="sub">${r.type} · ${r.lat.slice(0, 7)}, ${r.lon.slice(0, 8)}</div>`;
    li.addEventListener('click', () => {
      onSelect({ name: r.display_name, lat: parseFloat(r.lat), lon: parseFloat(r.lon) }, name);
      closeAutocomplete();
    });
    autocompleteList.appendChild(li);
  });
  autocompleteList.classList.add('open');
}

function showStatus(msg, isError = false) {
  const el = document.getElementById('status');
  el.innerHTML = msg;
  el.className = isError ? 'error' : '';
  if (!msg) document.getElementById('results').classList.remove('visible');
}

// Renders the saved races panel
function renderSavedRaces(races) {
  const panel = document.getElementById('savedPanel');
  const chips = document.getElementById('raceChips');
  if (!races.length) { panel.hidden = true; return; }
  panel.hidden = false;
  chips.innerHTML = races.map(r => `
    <div class="race-chip" data-id="${r.id}" data-lat="${r.lat}" data-lon="${r.lon}" data-location="${encodeURIComponent(r.location_name)}">
      <button class="chip-name">${r.name}</button>
      <button class="chip-delete" title="Remove">×</button>
    </div>
  `).join('');
}

// Renders the full forecast into #results. location = { name, lat, lon }
function renderForecast(data, dateStr, location) {
  const times    = data.hourly.time;
  const temps    = data.hourly.temperature_2m;
  const feelsLike= data.hourly.apparent_temperature;
  const pop      = data.hourly.precipitation_probability;
  const precip   = data.hourly.precipitation;
  const codes    = data.hourly.weathercode;
  const wind     = data.hourly.windspeed_10m;
  const windDir  = data.hourly.winddirection_10m;
  const humidity = data.hourly.relativehumidity_2m;
  const uvIndex  = data.hourly.uv_index;

  // Race morning = 5 AM – 12 PM on race date
  const raceMorning = times.reduce((acc, t, i) => {
    const h = new Date(t).getHours();
    if (t.startsWith(dateStr) && h >= 5 && h <= 12) acc.push({ i, h });
    return acc;
  }, []);

  if (!raceMorning.length) {
    showStatus(`No forecast available for ${dateStr}. Open-Meteo provides up to 16 days of forecasts.`, true);
    return;
  }

  const morningTemps    = raceMorning.map(x => temps[x.i]);
  const morningFL       = raceMorning.map(x => feelsLike[x.i]);
  const morningWind     = raceMorning.map(x => wind[x.i]);
  const morningPop      = raceMorning.map(x => pop[x.i]);
  const morningHumidity = raceMorning.map(x => humidity[x.i]);
  const morningUV       = raceMorning.map(x => uvIndex[x.i]);

  const avgTemp   = avg(morningTemps);
  const maxWind   = Math.max(...morningWind);
  const maxPop    = Math.max(...morningPop);
  const avgHum    = avg(morningHumidity);
  const maxUV     = Math.max(...morningUV);
  const totalPrec = raceMorning.reduce((s, x) => s + (precip[x.i] || 0), 0);
  const startTemp = temps[raceMorning[0].i];
  const startFL   = feelsLike[raceMorning[0].i];
  const windDirLabel = degreesToCompass(windDir[raceMorning[0].i]);

  const { rating, ratingClass, narrative, tips } = analyzeConditions({
    avgTemp, maxWind, maxPop, avgHum, totalPrec, maxUV, startFL,
  });

  const locShort = (location.name || '').split(',').slice(0, 2).join(',');
  const dateLong = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  let html = `
    <div class="summary-card">
      <div class="summary-top">
        <div class="summary-location">
          <h2>${locShort}</h2>
          <div class="date-label">${dateLong}</div>
        </div>
        <span class="rating-badge rating-${ratingClass}">${rating}</span>
      </div>
      <p class="summary-narrative">${narrative}</p>
      <div class="summary-stats">
        <div class="stat-box">
          <div class="stat-label">Start Temp</div>
          <div class="stat-value">${Math.round(startTemp)}°F</div>
          <div class="stat-sub">Feels ${Math.round(startFL)}°F</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Morning Range</div>
          <div class="stat-value">${Math.round(Math.min(...morningTemps))}–${Math.round(Math.max(...morningTemps))}°F</div>
          <div class="stat-sub">at gun through finish</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Humidity</div>
          <div class="stat-value">${Math.round(avgHum)}%</div>
          <div class="stat-sub">${avgHum < 50 ? 'Low' : avgHum < 70 ? 'Moderate' : 'High'}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Max Wind</div>
          <div class="stat-value">${Math.round(maxWind)} mph</div>
          <div class="stat-sub">${windDirLabel}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Rain Chance</div>
          <div class="stat-value">${Math.round(maxPop)}%</div>
          <div class="stat-sub">${totalPrec > 0.01 ? totalPrec.toFixed(2) + '"' : 'dry'}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">UV Index</div>
          <div class="stat-value">${Math.round(maxUV)}</div>
          <div class="stat-sub">${uvLabel(maxUV)}</div>
        </div>
      </div>
    </div>

    <div class="hourly-section">
      <h3>Race Morning — Hour by Hour</h3>
      <div class="hourly-grid">
  `;

  raceMorning.forEach(({ i, h }) => {
    const isStart = h === 5;
    const label = h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    const p = pop[i] ?? 0;
    html += `
      <div class="hour-card${isStart ? ' highlight' : ''}">
        <div class="hour-label">${isStart ? '🚀 ' : ''}${label}</div>
        <div class="hour-icon">${weatherIcon(codes[i], h)}</div>
        <div class="hour-temp">${Math.round(temps[i])}°F</div>
        <div class="hour-desc">${weatherDesc(codes[i])}</div>
        <div class="hour-detail">
          <span>Feels ${Math.round(feelsLike[i])}°F</span>
          <span>💨 ${Math.round(wind[i])} mph</span>
          <span>💧 ${Math.round(humidity[i])}%</span>
        </div>
        <span class="hour-pop${p >= 40 ? ' wet' : ''}">${p}% rain</span>
      </div>
    `;
  });

  html += `</div></div>`;

  if (tips.length) {
    html += `<div class="tips-section"><h3>Runner Tips</h3><div class="tips-grid">`;
    tips.forEach(t => {
      html += `<div class="tip-item"><span class="tip-icon">${t.icon}</span><span>${t.text}</span></div>`;
    });
    html += `</div></div>`;
  }

  html += `
    <div class="save-section">
      <h3>Save Race</h3>
      <div class="save-form">
        <input type="text" id="raceNameInput" placeholder="Race name (e.g. Boston Marathon 2026)" />
        <button class="btn-save" id="saveRaceBtn" onclick="handleSaveRace()">Save</button>
      </div>
      <div id="saveMsg" class="save-msg"></div>
    </div>
  `;

  showStatus('');
  const resultsEl = document.getElementById('results');
  resultsEl.innerHTML = html;
  resultsEl.classList.add('visible');
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
