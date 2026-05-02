// DOM rendering — no state, no API calls

const autocompleteList = document.getElementById('autocompleteList');

function closeAutocomplete() {
  autocompleteList.classList.remove('open');
}

function formatDate(dateStr, options = {}) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', options);
}

function formatHour(hour) {
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}

function raceSubline(race) {
  return `${race.city} · ${formatDate(race.race_date, { month: 'short', day: 'numeric', year: 'numeric' })} · ${formatHour(race.start_hour)} start`;
}

// onSelect(marathon) called when user picks a suggestion
function renderAutocomplete(results, onSelect) {
  if (!results.length) {
    closeAutocomplete();
    return;
  }

  autocompleteList.innerHTML = '';
  results.forEach(r => {
    const li = document.createElement('li');
    li.innerHTML = `<div>${r.name}</div><div class="sub">${raceSubline(r)}</div>`;
    li.addEventListener('click', () => {
      onSelect(r);
      closeAutocomplete();
    });
    autocompleteList.appendChild(li);
  });
  autocompleteList.classList.add('open');
}

function renderMarathonSuggestions(races, onSelect) {
  const panel = document.getElementById('marathonPanel');
  const list = document.getElementById('marathonList');
  if (!panel || !list || !races.length) return;

  panel.hidden = false;
  list.innerHTML = races.map(r => `
    <button class="marathon-chip" data-slug="${r.slug}">
      <span>${r.name}</span>
      <small>${formatDate(r.race_date, { month: 'short', day: 'numeric' })}</small>
    </button>
  `).join('');

  list.onclick = e => {
    const chip = e.target.closest('.marathon-chip');
    if (!chip) return;
    const race = races.find(r => r.slug === chip.dataset.slug);
    if (race) onSelect(race);
  };
}

function showStatus(msg, isError = false) {
  const el = document.getElementById('status');
  el.innerHTML = msg;
  el.className = isError ? 'error' : '';
  if (!msg) document.getElementById('results').classList.remove('visible');
}

// race = { name, city, lat, lon, race_date, start_hour }
function renderForecast(data, dateStr, race) {
  const times     = data.hourly.time;
  const temps     = data.hourly.temperature_2m;
  const feelsLike = data.hourly.apparent_temperature;
  const pop       = data.hourly.precipitation_probability;
  const precip    = data.hourly.precipitation;
  const codes     = data.hourly.weathercode;
  const wind      = data.hourly.windspeed_10m;
  const windDir   = data.hourly.winddirection_10m;
  const humidity  = data.hourly.relativehumidity_2m;
  const uvIndex   = data.hourly.uv_index;

  const startHour = race.start_hour ?? race.startHour ?? 8;
  const endHour = startHour + 6;

  const raceWindow = times.reduce((acc, t, i) => {
    const h = new Date(t).getHours();
    if (t.startsWith(dateStr) && h >= startHour && h <= endHour) acc.push({ i, h });
    return acc;
  }, []);

  if (!raceWindow.length) {
    showStatus(`No weather data available for ${race.name} on ${formatDate(dateStr)}.`, true);
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

  const mode = data.source || (Array.isArray(data.climate_years) ? 'climate' : 'forecast');
  const dateLong = formatDate(dateStr, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const tempRange = `${Math.round(Math.min(...windowTemps))}–${Math.round(Math.max(...windowTemps))}°F`;

  let modeBanner = '';
  if (mode === 'past') {
    modeBanner = `
      <div class="data-banner past-banner">
        <div class="data-banner-title">Past race-day weather</div>
        <div class="data-banner-sub">Actual archived weather for ${race.name} on ${dateLong}</div>
      </div>`;
  } else if (mode === 'climate') {
    const years = data.climate_years.slice().sort((a, b) => a - b);
    const avail = new Date(dateStr + 'T00:00:00');
    avail.setDate(avail.getDate() - 16);
    modeBanner = `
      <div class="data-banner climate-banner">
        <div class="data-banner-title">Forecast is not available yet</div>
        <div class="data-banner-sub">Showing historical averages from ${years[0]}–${years[years.length - 1]}. Live forecast starts ${avail.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</div>
      </div>`;
  }

  let html = `
    <div class="summary-card rating-${ratingClass}">
      ${modeBanner}
      <div class="summary-header">
        <div class="summary-title">
          <h2>${race.name}</h2>
          <div class="race-meta">${race.city} · ${dateLong} · Gun ${formatHour(startHour)}</div>
        </div>
        <span class="rating-badge rating-${ratingClass}">${rating}</span>
      </div>

      <div class="summary-hero">
        <div>
          <div class="hero-temp-value">${Math.round(startTemp)}°</div>
          <div class="hero-temp-sub">
            <span>${mode === 'climate' ? 'Average feels' : 'Feels'} ${Math.round(startFL)}°F · ${weatherDesc(startCode)}</span>
            <span>${tempRange} over ${endHour - startHour}h race window</span>
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
          <span class="stat-pill-label">${mode === 'climate' ? 'Rain freq.' : 'Rain'}</span>
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

  html += `<div class="hourly-section"><div class="section-label">Race Window</div><div class="hourly-track">`;

  raceWindow.forEach(({ i, h }) => {
    const isStart = h === startHour;
    const p = pop[i] ?? 0;
    html += `
      <div class="hour-card${isStart ? ' highlight' : ''}">
        <div class="hour-time">${isStart ? 'Start · ' : ''}${formatHour(h).replace(':00 ', ' ')}</div>
        <div class="hour-icon">${weatherIcon(codes[i], h)}</div>
        <div class="hour-temp">${Math.round(temps[i])}°</div>
        <div class="hour-feels">Feels ${Math.round(feelsLike[i])}°</div>
        <div class="hour-wind">Wind ${Math.round(wind[i])} mph</div>
        <span class="hour-pop${p >= 40 ? ' wet' : ''}">${p}% ${mode === 'climate' ? 'rain freq.' : 'rain'}</span>
      </div>
    `;
  });

  html += `</div></div>`;

  if (mode === 'climate' && Array.isArray(data.climate_yearly) && data.climate_yearly.length) {
    const rows = data.climate_yearly
      .map(yearData => {
        const yearWindow = yearData.hourly.time.reduce((acc, t, i) => {
          const h = new Date(t).getHours();
          if (h >= startHour && h <= endHour) acc.push(i);
          return acc;
        }, []);
        if (!yearWindow.length) return null;

        const tempsForYear = yearWindow.map(i => yearData.hourly.temperature_2m[i]);
        const feelsForYear = yearWindow.map(i => yearData.hourly.apparent_temperature[i]);
        const avgYearTemp = avg(tempsForYear);
        const avgYearFeels = avg(feelsForYear);
        const minYearTemp = Math.min(...tempsForYear);
        const maxYearTemp = Math.max(...tempsForYear);

        return `
          <div class="year-temp-row">
            <div>
              <div class="year-temp-year">${yearData.year}</div>
              <div class="year-temp-range">${Math.round(minYearTemp)}–${Math.round(maxYearTemp)}°F range</div>
            </div>
            <div class="year-temp-values">
              <span>${Math.round(avgYearTemp)}° avg</span>
              <small>${Math.round(avgYearFeels)}° feels</small>
            </div>
          </div>
        `;
      })
      .filter(Boolean)
      .join('');

    if (rows) {
      html += `
        <div class="yearly-section">
          <div class="section-label">Year by Year</div>
          <div class="year-temp-list">${rows}</div>
        </div>
      `;
    }
  }

  if (tips.length) {
    html += `<div class="tips-section"><div class="section-label">Runner Tips</div><div class="tips-list">`;
    tips.forEach(t => {
      html += `<div class="tip-item"><span class="tip-icon">${t.icon}</span><span>${t.text}</span></div>`;
    });
    html += `</div></div>`;
  }

  showStatus('');
  const resultsEl = document.getElementById('results');
  resultsEl.innerHTML = html;
  resultsEl.classList.add('visible');
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
