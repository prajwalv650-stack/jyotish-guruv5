// utils/astroCalc.js - Core astrology calculations (Swiss Ephemeris-style math)

/**
 * Convert degrees to radians
 */
const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Convert radians to degrees
 */
const toDeg = (rad) => (rad * 180) / Math.PI;

/**
 * Normalize degrees to 0-360 range
 */
const normalizeDeg = (deg) => ((deg % 360) + 360) % 360;

/**
 * Get zodiac sign from ecliptic longitude (0-360 degrees)
 */
const getZodiacSign = (longitude) => {
  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  const index = Math.floor(normalizeDeg(longitude) / 30);
  return signs[index];
};

/**
 * Get degrees within sign (0-30)
 */
const getDegreesInSign = (longitude) => {
  return normalizeDeg(longitude) % 30;
};

/**
 * Get nakshatra (lunar mansion) from Moon longitude
 * 27 nakshatras, each 13°20'
 */
const getNakshatra = (longitude) => {
  const nakshatras = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira",
    "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
    "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati",
    "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
    "Uttara Ashadha", "Shravana", "Dhanishtha", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
  ];
  const index = Math.floor(normalizeDeg(longitude) / (360 / 27));
  return nakshatras[index];
};

/**
 * Julian Day Number from Gregorian date
 */
const julianDay = (year, month, day, hour = 0) => {
  // Adjust for January and February
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day + hour / 24 + B - 1524.5;
};

/**
 * Get approximate Sun longitude for a given Julian Day
 * Uses simplified VSOP87 theory
 */
const getSunLongitude = (jd) => {
  const n = jd - 2451545.0; // Days since J2000.0
  const L = normalizeDeg(280.46646 + 36000.76983 * (n / 36525)); // Mean longitude
  const M = normalizeDeg(357.52911 + 35999.05029 * (n / 36525)); // Mean anomaly
  const Mrad = toRad(M);
  // Equation of center
  const C = (1.914602 - 0.004817 * (n / 36525)) * Math.sin(Mrad)
    + 0.019993 * Math.sin(2 * Mrad)
    + 0.000289 * Math.sin(3 * Mrad);
  return normalizeDeg(L + C);
};

/**
 * Get approximate Moon longitude for a given Julian Day
 */
const getMoonLongitude = (jd) => {
  const T = (jd - 2451545.0) / 36525;
  // Moon's mean longitude
  let L = 218.3164477 + 481267.88123421 * T;
  // Moon's mean anomaly
  let M_moon = 134.9633964 + 477198.8675055 * T;
  // Sun's mean anomaly
  let M_sun = 357.5291092 + 35999.0502909 * T;
  // Moon's argument of latitude
  let F = 93.2720950 + 483202.0175233 * T;

  // Major perturbations
  const lon = L
    + 6.288774 * Math.sin(toRad(M_moon))
    + 1.274027 * Math.sin(toRad(2 * L - M_moon))  // Actually D
    + 0.658314 * Math.sin(toRad(2 * L))
    + 0.213618 * Math.sin(toRad(2 * M_moon))
    - 0.185116 * Math.sin(toRad(M_sun))
    - 0.114332 * Math.sin(toRad(2 * F));

  return normalizeDeg(lon);
};

/**
 * Get approximate planetary longitudes for a Julian Day
 * Using simplified mean orbital elements
 */
const getPlanetaryPositions = (jd) => {
  const T = (jd - 2451545.0) / 36525; // Julian centuries from J2000.0

  // Mean longitudes (simplified)
  const planets = {
    Mercury: normalizeDeg(252.2503 + 149472.6741 * T),
    Venus:   normalizeDeg(181.9798 + 58517.8156 * T),
    Mars:    normalizeDeg(355.4330 + 19140.2993 * T),
    Jupiter: normalizeDeg(34.3515 + 3034.9057 * T),
    Saturn:  normalizeDeg(50.0775 + 1222.1138 * T),
    Rahu:    normalizeDeg(125.0445 - 1934.1363 * T), // Mean lunar node (descending)
  };

  // Ketu is always opposite Rahu
  planets.Ketu = normalizeDeg(planets.Rahu + 180);

  return planets;
};

/**
 * Calculate the Ascendant (Lagna) based on birth time and location
 * Uses Sidereal Time and obliquity of ecliptic
 */
const calculateAscendant = (jd, latitude, longitude) => {
  const T = (jd - 2451545.0) / 36525;

  // Greenwich Mean Sidereal Time (degrees)
  let GMST = 280.46061837 + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * T * T;
  GMST = normalizeDeg(GMST);

  // Local Sidereal Time
  const LST = normalizeDeg(GMST + longitude);

  // Obliquity of ecliptic
  const epsilon = 23.439291111 - 0.013004167 * T;
  const epsilonRad = toRad(epsilon);

  // Ascendant calculation
  const LSTrad = toRad(LST);
  const latRad = toRad(latitude);

  const y = -Math.cos(LSTrad);
  const x = Math.sin(LSTrad) * Math.cos(epsilonRad) + Math.tan(latRad) * Math.sin(epsilonRad);

  let asc = normalizeDeg(toDeg(Math.atan2(y, x)));

  return asc;
};

/**
 * Apply Ayanamsa (Lahiri) to convert Tropical to Sidereal longitude
 * Lahiri Ayanamsa ≈ 23°51' at J2000.0, increasing ~50.3"/year
 */
const applyAyanamsa = (tropicalLon, jd) => {
  const T = (jd - 2451545.0) / 36525;
  // Lahiri ayanamsa
  const ayanamsa = 23.85 + 0.013972 * T * 100; // Rough approximation
  return normalizeDeg(tropicalLon - ayanamsa);
};

/**
 * Get house number (1-12) from longitude and ascendant
 */
const getHouseNumber = (longitude, ascendant) => {
  const diff = normalizeDeg(longitude - ascendant);
  return Math.floor(diff / 30) + 1;
};

/**
 * Main function: Calculate full birth chart
 */
const calculateBirthChart = (dateStr, timeStr, latStr, lonStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  const hourDecimal = hour + minute / 60;
  const utcOffset = lon / 15; // Approximate UTC offset from longitude
  const utcHour = hourDecimal - utcOffset;

  const jd = julianDay(year, month, day, utcHour);

  // Tropical positions
  const sunTropical = getSunLongitude(jd);
  const moonTropical = getMoonLongitude(jd);
  const ascTropical = calculateAscendant(jd, lat, lon);
  const planetsTropical = getPlanetaryPositions(jd);

  // Convert to Sidereal (Vedic/Lahiri)
  const sunSidereal = applyAyanamsa(sunTropical, jd);
  const moonSidereal = applyAyanamsa(moonTropical, jd);
  const ascSidereal = applyAyanamsa(ascTropical, jd);

  const planetsSidereal = {};
  for (const [planet, lon] of Object.entries(planetsTropical)) {
    planetsSidereal[planet] = applyAyanamsa(lon, jd);
  }

  // Build chart data
  const chart = {
    ascendant: {
      sign: getZodiacSign(ascSidereal),
      degrees: getDegreesInSign(ascSidereal).toFixed(2),
      longitude: ascSidereal.toFixed(2)
    },
    sun: {
      sign: getZodiacSign(sunSidereal),
      degrees: getDegreesInSign(sunSidereal).toFixed(2),
      house: getHouseNumber(sunSidereal, ascSidereal)
    },
    moon: {
      sign: getZodiacSign(moonSidereal),
      degrees: getDegreesInSign(moonSidereal).toFixed(2),
      house: getHouseNumber(moonSidereal, ascSidereal),
      nakshatra: getNakshatra(moonSidereal)
    },
    planets: {}
  };

  for (const [planet, lon] of Object.entries(planetsSidereal)) {
    chart.planets[planet] = {
      sign: getZodiacSign(lon),
      degrees: getDegreesInSign(lon).toFixed(2),
      house: getHouseNumber(lon, ascSidereal)
    };
  }

  return chart;
};

// ─────────────────────────────────────────────
// GUNA MILAN (Ashta Koota Matching)
// ─────────────────────────────────────────────

const MOON_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// Nadi (8 points)
const NADI = ["Adi", "Madhya", "Antya", "Adi", "Madhya", "Antya",
              "Adi", "Madhya", "Antya", "Adi", "Madhya", "Antya"];

// Gana (6 points)
const GANA = ["Deva", "Manava", "Rakshasa", "Deva", "Manava", "Rakshasa",
              "Manava", "Rakshasa", "Deva", "Rakshasa", "Deva", "Manava"];

// Bhakoot (7 points) — simplified by sign index compatibility
const getBhakootScore = (boySignIdx, girlSignIdx) => {
  const diff = Math.abs(boySignIdx - girlSignIdx);
  const incompatible = [6]; // 7th sign opposition
  return incompatible.includes(diff) ? 0 : 7;
};

/**
 * Calculate Guna Milan score out of 36
 */
const calculateGunaMilan = (boyMoonSign, girlMoonSign) => {
  const boyIdx = MOON_SIGNS.indexOf(boyMoonSign);
  const girlIdx = MOON_SIGNS.indexOf(girlMoonSign);

  if (boyIdx === -1 || girlIdx === -1) {
    return { score: 18, details: "Could not find moon signs, using default." };
  }

  let score = 0;
  const details = {};

  // 1. Varna (1 point)
  const varnaOrder = [3, 2, 1, 4, 4, 3, 2, 1, 4, 3, 2, 1]; // Rough caste levels
  details.Varna = varnaOrder[boyIdx] >= varnaOrder[girlIdx] ? 1 : 0;
  score += details.Varna;

  // 2. Vasya (2 points)
  details.Vasya = boyIdx === girlIdx ? 2 : Math.abs(boyIdx - girlIdx) <= 2 ? 1 : 0;
  score += details.Vasya;

  // 3. Tara (3 points)
  const taraDiff = Math.abs(boyIdx - girlIdx) % 9;
  details.Tara = taraDiff <= 3 ? 3 : taraDiff <= 6 ? 1 : 0;
  score += details.Tara;

  // 4. Yoni (4 points)
  details.Yoni = boyIdx === girlIdx ? 4 : (boyIdx + girlIdx) % 2 === 0 ? 2 : 1;
  score += details.Yoni;

  // 5. Graha Maitri (5 points)
  details.GrahaMaitri = Math.abs(boyIdx - girlIdx) <= 3 ? 5 : 2;
  score += details.GrahaMaitri;

  // 6. Gana (6 points)
  const boyGana = GANA[boyIdx];
  const girlGana = GANA[girlIdx];
  details.Gana = boyGana === girlGana ? 6 : boyGana === "Deva" && girlGana !== "Rakshasa" ? 5 : 0;
  score += details.Gana;

  // 7. Bhakoot (7 points)
  details.Bhakoot = getBhakootScore(boyIdx, girlIdx);
  score += details.Bhakoot;

  // 8. Nadi (8 points)
  details.Nadi = NADI[boyIdx] !== NADI[girlIdx] ? 8 : 0;
  score += details.Nadi;

  return { score: Math.min(score, 36), details };
};

module.exports = {
  calculateBirthChart,
  calculateGunaMilan,
  getZodiacSign,
  getMoonLongitude,
  applyAyanamsa,
  julianDay
};
