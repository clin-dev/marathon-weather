// Curated list of major marathons — { name, city, lat, lon, startHour (24h) }
const MARATHONS = [
  // World Marathon Majors
  { name: 'Boston Marathon',                    city: 'Boston, MA',          lat: 42.3500,  lon: -71.0767,   startHour: 9  },
  { name: 'New York City Marathon',             city: 'New York, NY',        lat: 40.7829,  lon: -73.9654,   startHour: 9  },
  { name: 'Chicago Marathon',                   city: 'Chicago, IL',         lat: 41.8825,  lon: -87.6238,   startHour: 7  },
  { name: 'London Marathon',                    city: 'London, UK',          lat: 51.4994,  lon: -0.1245,    startHour: 10 },
  { name: 'Berlin Marathon',                    city: 'Berlin, Germany',     lat: 52.5145,  lon: 13.3501,    startHour: 9  },
  { name: 'Tokyo Marathon',                     city: 'Tokyo, Japan',        lat: 35.6897,  lon: 139.6922,   startHour: 9  },

  // US — Popular
  { name: 'Marine Corps Marathon',              city: 'Arlington, VA',       lat: 38.8749,  lon: -77.0560,   startHour: 7  },
  { name: 'Honolulu Marathon',                  city: 'Honolulu, HI',        lat: 21.3069,  lon: -157.8583,  startHour: 5  },
  { name: 'Walt Disney World Marathon',         city: 'Orlando, FL',         lat: 28.3772,  lon: -81.5707,   startHour: 5  },
  { name: 'Los Angeles Marathon',               city: 'Los Angeles, CA',     lat: 34.0522,  lon: -118.2437,  startHour: 6  },
  { name: 'San Francisco Marathon',             city: 'San Francisco, CA',   lat: 37.7749,  lon: -122.4194,  startHour: 5  },
  { name: 'Philadelphia Marathon',              city: 'Philadelphia, PA',    lat: 39.9526,  lon: -75.1652,   startHour: 7  },
  { name: 'Houston Marathon',                   city: 'Houston, TX',         lat: 29.7604,  lon: -95.3698,   startHour: 7  },
  { name: 'Atlanta Marathon',                   city: 'Atlanta, GA',         lat: 33.7490,  lon: -84.3880,   startHour: 7  },
  { name: 'Portland Marathon',                  city: 'Portland, OR',        lat: 45.5051,  lon: -122.6750,  startHour: 7  },
  { name: 'Seattle Marathon',                   city: 'Seattle, WA',         lat: 47.6062,  lon: -122.3321,  startHour: 8  },
  { name: 'Nashville Marathon',                 city: 'Nashville, TN',       lat: 36.1627,  lon: -86.7816,   startHour: 7  },
  { name: 'Richmond Marathon',                  city: 'Richmond, VA',        lat: 37.5407,  lon: -77.4360,   startHour: 8  },
  { name: 'Denver Marathon',                    city: 'Denver, CO',          lat: 39.7392,  lon: -104.9903,  startHour: 6  },
  { name: 'Twin Cities Marathon',               city: 'Minneapolis, MN',     lat: 44.9778,  lon: -93.2650,   startHour: 8  },
  { name: 'St. George Marathon',                city: 'St. George, UT',      lat: 37.0965,  lon: -113.5684,  startHour: 6  },
  { name: 'Big Sur International Marathon',     city: 'Big Sur, CA',         lat: 36.2704,  lon: -121.8081,  startHour: 6  },
  { name: "Grandma's Marathon",                 city: 'Duluth, MN',          lat: 46.7867,  lon: -92.1005,   startHour: 7  },
  { name: 'Pittsburgh Marathon',                city: 'Pittsburgh, PA',      lat: 40.4406,  lon: -79.9959,   startHour: 7  },
  { name: 'Cleveland Marathon',                 city: 'Cleveland, OH',       lat: 41.4993,  lon: -81.6944,   startHour: 7  },
  { name: 'Columbus Marathon',                  city: 'Columbus, OH',        lat: 39.9612,  lon: -82.9988,   startHour: 7  },
  { name: 'Indianapolis Monumental Marathon',   city: 'Indianapolis, IN',    lat: 39.7684,  lon: -86.1581,   startHour: 8  },
  { name: 'Detroit Free Press Marathon',        city: 'Detroit, MI',         lat: 42.3314,  lon: -83.0458,   startHour: 7  },
  { name: 'Phoenix Marathon',                   city: 'Phoenix, AZ',         lat: 33.4484,  lon: -112.0740,  startHour: 6  },
  { name: 'Tucson Marathon',                    city: 'Tucson, AZ',          lat: 32.2226,  lon: -110.9747,  startHour: 7  },
  { name: 'Sacramento Marathon',                city: 'Sacramento, CA',      lat: 38.5816,  lon: -121.4944,  startHour: 7  },
  { name: 'Dallas Marathon',                    city: 'Dallas, TX',          lat: 32.7767,  lon: -96.7970,   startHour: 7  },
  { name: 'Austin Marathon',                    city: 'Austin, TX',          lat: 30.2672,  lon: -97.7431,   startHour: 7  },
  { name: 'New Orleans Marathon',               city: 'New Orleans, LA',     lat: 29.9511,  lon: -90.0715,   startHour: 7  },
  { name: 'Miami Marathon',                     city: 'Miami, FL',           lat: 25.7617,  lon: -80.1918,   startHour: 6  },
  { name: 'Cincinnati Flying Pig Marathon',     city: 'Cincinnati, OH',      lat: 39.1031,  lon: -84.5120,   startHour: 6  },
  { name: 'Eugene Marathon',                    city: 'Eugene, OR',          lat: 44.0521,  lon: -123.0868,  startHour: 7  },
  { name: 'Charlotte Marathon',                 city: 'Charlotte, NC',       lat: 35.2271,  lon: -80.8431,   startHour: 7  },
  { name: 'Vermont City Marathon',              city: 'Burlington, VT',      lat: 44.4759,  lon: -73.2121,   startHour: 8  },
  { name: 'Missoula Marathon',                  city: 'Missoula, MT',        lat: 46.8787,  lon: -113.9966,  startHour: 6  },

  // International
  { name: 'Sydney Marathon',                    city: 'Sydney, Australia',   lat: -33.8688, lon: 151.2093,   startHour: 7  },
  { name: 'Paris Marathon',                     city: 'Paris, France',       lat: 48.8566,  lon: 2.3522,     startHour: 8  },
  { name: 'Amsterdam Marathon',                 city: 'Amsterdam, Netherlands', lat: 52.3676, lon: 4.9041,   startHour: 10 },
  { name: 'Toronto Waterfront Marathon',        city: 'Toronto, Canada',     lat: 43.6532,  lon: -79.3832,   startHour: 8  },
  { name: 'Vancouver Marathon',                 city: 'Vancouver, Canada',   lat: 49.2827,  lon: -123.1207,  startHour: 8  },
];

function searchMarathons(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return MARATHONS.filter(r =>
    r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q)
  ).slice(0, 8);
}
