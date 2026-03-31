// Pure domain logic — no DOM dependencies

function toLocalDateString(d) {
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function avg(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function degreesToCompass(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function uvLabel(uv) {
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very High';
  return 'Extreme';
}

// WMO Weather Interpretation Codes → emoji icon
function weatherIcon(code, hour) {
  const night = hour < 6 || hour >= 20;
  if (code === 0)                         return night ? '🌙' : '☀️';
  if (code === 1)                         return night ? '🌙' : '🌤️';
  if (code === 2)                         return '⛅';
  if (code === 3)                         return '☁️';
  if ([45, 48].includes(code))            return '🌫️';
  if ([51, 53, 55].includes(code))        return '🌦️';
  if ([56, 57].includes(code))            return '🌨️';
  if ([61, 63, 65].includes(code))        return '🌧️';
  if ([66, 67].includes(code))            return '🌨️';
  if ([71, 73, 75, 77].includes(code))    return '❄️';
  if ([80, 81, 82].includes(code))        return '🌦️';
  if ([85, 86].includes(code))            return '🌨️';
  if ([95, 96, 99].includes(code))        return '⛈️';
  return '🌡️';
}

// WMO Weather Interpretation Codes → text description
function weatherDesc(code) {
  const map = {
    0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Icy fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    56: 'Freezing drizzle', 57: 'Heavy freezing drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    66: 'Freezing rain', 67: 'Heavy freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Showers', 81: 'Rain showers', 82: 'Heavy showers',
    85: 'Snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Severe thunderstorm',
  };
  return map[code] || 'Unknown';
}

// Scores conditions and returns rating, narrative, and tips
function analyzeConditions({ avgTemp, maxWind, maxPop, avgHum, totalPrec, maxUV, startFL }) {
  let score = 0; // higher = worse
  const tips = [];

  // Temperature score (ideal 45–55°F feels-like)
  if (startFL < 30)       score += 3;
  else if (startFL < 40)  score += 1;
  else if (startFL <= 55) score += 0; // ideal
  else if (startFL <= 65) score += 1;
  else if (startFL <= 75) score += 2;
  else                    score += 4;

  // Humidity
  if (avgHum > 80)      score += 2;
  else if (avgHum > 65) score += 1;

  // Wind
  if (maxWind > 25)      score += 3;
  else if (maxWind > 15) score += 1;

  // Rain
  if (maxPop > 70 || totalPrec > 0.2) score += 2;
  else if (maxPop > 40)               score += 1;

  // Rating
  let rating, ratingClass;
  if      (score === 0) { rating = 'Excellent';       ratingClass = 'excellent'; }
  else if (score <= 1)  { rating = 'Good';            ratingClass = 'good'; }
  else if (score <= 2)  { rating = 'Fair';            ratingClass = 'fair'; }
  else if (score <= 4)  { rating = 'Challenging';     ratingClass = 'hard'; }
  else                  { rating = 'Tough Conditions'; ratingClass = 'tough'; }

  // Narrative
  const tempDesc = startFL < 35 ? 'frigid' : startFL < 45 ? 'cold' : startFL < 55 ? 'cool and ideal' : startFL < 65 ? 'mild' : startFL < 75 ? 'warm' : 'hot';
  const windDesc = maxWind < 8 ? 'calm winds' : maxWind < 15 ? 'a light breeze' : maxWind < 25 ? 'noticeable headwinds' : 'strong winds';
  const rainDesc = maxPop < 20 ? 'dry skies' : maxPop < 50 ? 'a chance of light rain' : 'likely rain';
  const humDesc  = avgHum < 50 ? 'low humidity' : avgHum < 70 ? 'moderate humidity' : 'high humidity';

  const ratingAdvice = {
    'Excellent':       'Conditions are nearly perfect for a fast race — go get that PR!',
    'Good':            'Solid race conditions. Dress smart and execute your plan.',
    'Fair':            'Manageable conditions — adjust your pace goals slightly and stay hydrated.',
    'Challenging':     'Tough conditions ahead. Factor in extra time, stay conservative early, and prioritize finishing strong.',
    'Tough Conditions':'Difficult conditions. Prioritize safety and completion over time goals. Adjust expectations significantly.',
  };

  const narrative = `Race morning looks <strong>${tempDesc}</strong> with starts around ${Math.round(startFL)}°F (feels like).
    Expect ${windDesc}, ${rainDesc}, and ${humDesc}.
    ${ratingAdvice[rating]}`;

  // Tips
  if (startFL < 35) tips.push({ icon: '🧤', text: 'Wear gloves and a hat — you can ditch them at mile 2 if you warm up.' });
  if (startFL < 45) tips.push({ icon: '👕', text: 'Layer up for the start. A thin throwaway layer over your race kit works great.' });
  if (startFL > 70) tips.push({ icon: '🧊', text: 'Pre-cool with ice packs before the start. Grab ice at every aid station.' });
  if (startFL > 65) tips.push({ icon: '⏱️', text: 'Add 30–90 seconds per mile to your target pace for the heat/humidity combo.' });
  if (avgHum > 70)  tips.push({ icon: '💦', text: 'High humidity slows sweat evaporation. Drink on schedule, not just when thirsty.' });
  if (maxWind > 15) tips.push({ icon: '🌬️', text: 'Find a group to draft behind on windy stretches. Save energy for the back half.' });
  if (maxPop > 40)  tips.push({ icon: '🌧️', text: 'Rain is likely. Anti-chafe balm on any rub points, and waterproof your bib.' });
  if (maxUV > 5)    tips.push({ icon: '☀️', text: 'UV is elevated. Apply SPF 50 sunscreen 30 minutes before the start.' });
  if (startFL >= 45 && startFL <= 55 && maxWind < 12 && maxPop < 25) {
    tips.push({ icon: '🏆', text: 'These are PR conditions. Trust your training and go for it!' });
  }
  tips.push({ icon: '🥤', text: 'Hydrate consistently — aim for 4–6 oz every 15–20 minutes during the race.' });

  return { rating, ratingClass, narrative, tips };
}
