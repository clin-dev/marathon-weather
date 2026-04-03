// DOM rendering — no state, no API calls

const autocompleteList = document.getElementById('autocompleteList');

function closeAutocomplete() {
  autocompleteList.classList.remove('open');
}

// onSelect(marathon) called when user picks a suggestion
function renderAutocomplete(results, onSelect) {
  if (!results.length) { closeAutocomplete(); return; }
  autocompleteList.innerHTML = '';
  results.forEach(r => {
    const li = document.createElement('li');
    const startLabel = r.startHour < 12
      ? `${r.startHour}:00 AM`
      : r.startHour === 12 ? '12:00 PM' : `${r.startHour - 12}:00 PM`;
    li.innerHTML = `<div>${r.name}</div><div class="sub">${r.city} · ${startLabel} start</div>`;
    li.addEventListener('click', () => { onSelect(r); closeAutocomplete(); });
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

function renderSavedRaces(races) {
  const panel = document.getElementById('savedPanel');
  const chips = document.getElementById('raceChips');
  if (!races.length) { panel.hidden = true; return; }
  panel.hidden = false;
  chips.innerHTML = races.map(r => `
    <div class="race-chip" data-id="${r.id}" data-lat="${r.lat}" data-lon="${r.lon}"
         data-location="${encodeURIComponent(r.location_name)}" data-start-hour="${r.start_hour || 8}">
      <button class="chip-name">${r.name}</button>
      <button class="chip-delete" title="Remove">×</button>
    </div>
  `).join('');
}

// race = { name, city, lat, lon, startHour }
function renderForecast(data, dateStr, race) {
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

  const startHour = race.startHour ?? 8;
  const endHour   = startHour + 6;

  const raceWindow = times.reduce((acc, t, i) => {
    const h = new Date(t).getHours();
    if (t.startsWith(dateStr) && h >= startHour && h <= endHour) acc.push({ i, h });
    return acc;
  }, []);

  if (!raceWindow.length) {
    showStatus(`No forecast available for ${dateStr}. Open-Meteo provides up to 16 days of forecasts.`, true);
    return;
  }

  const windowTemps    = raceWindow.map(x => temps[x.i]);
  const windowFL       = raceWindow.map(x => feelsLike[x.i]);
  const windowWind     = raceWindow.map(x => wind[x.i]);
  const windowPop      = raceWindow.map(x => pop[x.i]);
  const windowHumidity = raceWindow.map(x => humidity[x.i]);
  const windowUV       = raceWindow.map(x => uvIndex[x.i]);

  const avgTemp   = avg(windowTemps);
  const maxWind   = Math.max(...windowWind);
  const maxPop    = Math.max(...windowPop);
  const avgHum    = avg(windowHumidity);
  const maxUV     = Math.max(...windowUV);
  const totalPrec = raceWindow.reduce((s, x) => s + (precip[x.i] || 0), 0);
  const startFL   = feelsLike[raceWindow[0].i];
  const startTemp = temps[raceWindow[0].i];
  const windDirLabel = degreesToCompass(windDir[raceWindow[0].i]);
  const startCode = codes[raceWindow[0].i];

  const { rating, ratingClass, narrative, tips } = analyzeConditions({
    avgTemp, maxWind, maxPop, avgHum, totalPrec, maxUV, startFL,
  });

  const isClimate = Array.isArray(data.climate_years);

  const dateLong = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const startLabel = startHour < 12
    ? `${startHour}:00 AM`
    : startHour === 12 ? '12:00 PM' : `${startHour - 12}:00 PM`;

  const tempRange = `${Math.round(Math.min(...windowTemps))}–${Math.round(Math.max(...windowTemps))}°F`;

  let forecastAvailableDate = '';
  if (isClimate) {
    const avail = new Date(dateStr + 'T00:00:00');
    avail.setDate(avail.getDate() - 16);
    forecastAvailableDate = avail.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  // ── Summary card ──
  let html = `
    <div class="summary-card rating-${ratingClass}">
      ${isClimate ? `
      <div class="climate-banner">
        <div class="climate-banner-title">Historical average — no forecast yet</div>
        <div class="climate-banner-sub">Based on ${data.climate_years.slice().sort()[0]}–${data.climate_years.slice().sort().pop()} · Live forecast available ${forecastAvailableDate}</div>
      </div>` : ''}
      <div class="summary-header">
        <div class="summary-title">
          <h2>${race.name}</h2>
          <div class="race-meta">${race.city} · ${dateLong} · Gun ${startLabel}</div>
        </div>
        <span class="rating-badge rating-${ratingClass}">${rating}</span>
      </div>

      <div class="summary-hero">
        <div>
          <div class="hero-temp-value">${Math.round(startTemp)}°</div>
          <div class="hero-temp-sub">
            <span>${isClimate ? 'Avg feels' : 'Feels'} ${Math.round(startFL)}°F · ${weatherDesc(startCode)}</span>
            <span>${tempRange} over ${endHour - startHour}h race</span>
          </div>
        </div>
        <div class="hero-icon">${weatherIcon(startCode, startHour)}</div>
      </div>

      <div class="stats-row">
        <div class="stat-pill">
          <span class="stat-pill-label">Wind</span>
          <span class="stat-pill-value">${Math.round(maxWind)} mph ${windDirLabel}</span>
        </div>
        <div class="stat-pill">
          <span class="stat-pill-label">Rain</span>
          <span class="stat-pill-value">${Math.round(maxPop)}%${totalPrec > 0.01 ? ' · ' + totalPrec.toFixed(2) + '"' : ''}</span>
        </div>
        <div class="stat-pill">
          <span class="stat-pill-label">Humidity</span>
          <span class="stat-pill-value">${Math.round(avgHum)}%</span>
        </div>
        <div class="stat-pill">
          <span class="stat-pill-label">UV</span>
          <span class="stat-pill-value">${Math.round(maxUV)} · ${uvLabel(maxUV)}</span>
        </div>
      </div>

      <p class="summary-narrative">${narrative}</p>
    </div>
  `;

  // ── Hourly ──
  html += `<div class="hourly-section"><div class="section-label">Hour by Hour</div><div class="hourly-track">`;

  raceWindow.forEach(({ i, h }) => {
    const isStart = h === startHour;
    const label = h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    const p = pop[i] ?? 0;
    html += `
      <div class="hour-card${isStart ? ' highlight' : ''}">
        <div class="hour-time">${isStart ? '🚀 ' : ''}${label}</div>
        <div class="hour-icon">${weatherIcon(codes[i], h)}</div>
        <div class="hour-temp">${Math.round(temps[i])}°</div>
        <div class="hour-feels">Feels ${Math.round(feelsLike[i])}°</div>
        <div class="hour-wind">💨 ${Math.round(wind[i])} mph</div>
        <span class="hour-pop${p >= 40 ? ' wet' : ''}">${p}% rain</span>
      </div>
    `;
  });

  html += `</div></div>`;

  // ── Tips ──
  if (tips.length) {
    html += `<div class="tips-section"><div class="section-label">Runner Tips</div><div class="tips-list">`;
    tips.forEach(t => {
      html += `<div class="tip-item"><span class="tip-icon">${t.icon}</span><span>${t.text}</span></div>`;
    });
    html += `</div></div>`;
  }

  // ── Save ──
  html += `
    <div class="save-section">
      <div class="section-label">Save Race</div>
      <div class="save-form">
        <input type="text" id="raceNameInput" placeholder="Label (e.g. Boston 2026)" />
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
