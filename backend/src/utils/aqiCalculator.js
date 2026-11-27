/**
 * Official CPCB National Air Quality Index (NAQI) breakpoint calculator.
 * Consistent color & category scale used across backend, ML service, and UI.
 */

const NAQI_BREAKPOINTS = {
  pm25: [
    [0, 30, 0, 50],
    [30, 60, 51, 100],
    [60, 90, 101, 200],
    [90, 120, 201, 300],
    [120, 250, 301, 400],
    [250, 500, 401, 500],
  ],
  pm10: [
    [0, 50, 0, 50],
    [50, 100, 51, 100],
    [100, 250, 101, 200],
    [250, 350, 201, 300],
    [350, 430, 301, 400],
    [430, 600, 401, 500],
  ],
  no2: [
    [0, 40, 0, 50],
    [40, 80, 51, 100],
    [80, 180, 101, 200],
    [180, 280, 201, 300],
    [280, 400, 301, 400],
    [400, 600, 401, 500],
  ],
  so2: [
    [0, 40, 0, 50],
    [40, 80, 51, 100],
    [80, 380, 101, 200],
    [380, 800, 201, 300],
    [800, 1600, 301, 400],
    [1600, 2400, 401, 500],
  ],
  o3: [
    [0, 50, 0, 50],
    [50, 100, 51, 100],
    [100, 168, 101, 200],
    [168, 208, 201, 300],
    [208, 748, 301, 400],
    [748, 1000, 401, 500],
  ],
  co: [
    [0, 1.0, 0, 50],
    [1.0, 2.0, 51, 100],
    [2.0, 10.0, 101, 200],
    [10.0, 17.0, 201, 300],
    [17.0, 34.0, 301, 400],
    [34.0, 50.0, 401, 500],
  ],
};

export const AQI_BANDS = [
  { key: 'good', label: 'Good', min: 0, max: 50, color: '#10B981', advisory: 'Minimal impact' },
  { key: 'satisfactory', label: 'Satisfactory', min: 51, max: 100, color: '#84CC16', advisory: 'Minor breathing discomfort for sensitive groups' },
  { key: 'moderate', label: 'Moderate', min: 101, max: 200, color: '#F59E0B', advisory: 'Discomfort for people with asthma, children, and older adults' },
  { key: 'poor', label: 'Poor', min: 201, max: 300, color: '#F97316', advisory: 'Breathing discomfort on prolonged outdoor exertion' },
  { key: 'very_poor', label: 'Very Poor', min: 301, max: 400, color: '#EF4444', advisory: 'Respiratory illness risk on prolonged exposure' },
  { key: 'severe', label: 'Severe', min: 401, max: 500, color: '#991B1B', advisory: 'Affects healthy people; serious impact on vulnerable groups' },
];

export function computeSubIndex(pollutant, concentration) {
  if (concentration == null || Number.isNaN(Number(concentration)) || concentration < 0) {
    return null;
  }
  const table = NAQI_BREAKPOINTS[pollutant];
  if (!table) return null;

  const val = Number(concentration);
  for (const [bLo, bHi, iLo, iHi] of table) {
    if (val <= bHi) {
      const idx = ((iHi - iLo) / (bHi - bLo)) * (val - bLo) + iLo;
      return Math.round(idx);
    }
  }
  return 500;
}

export function getAqiBand(aqi) {
  const clamped = Math.max(0, Math.min(500, Math.round(Number(aqi) || 0)));
  return (
    AQI_BANDS.find((band) => clamped >= band.min && clamped <= band.max) ||
    AQI_BANDS[AQI_BANDS.length - 1]
  );
}

export function computeIndianAQI(pollutants = {}) {
  const subIndices = {};
  let maxAqi = 0;
  let dominantPollutant = 'pm25';

  for (const key of Object.keys(NAQI_BREAKPOINTS)) {
    const sub = computeSubIndex(key, pollutants[key]);
    if (sub !== null) {
      subIndices[key] = sub;
      if (sub >= maxAqi) {
        maxAqi = sub;
        dominantPollutant = key;
      }
    }
  }

  const band = getAqiBand(maxAqi);
  return {
    aqi: maxAqi,
    dominantPollutant: dominantPollutant.toUpperCase(),
    subIndices,
    category: band.label,
    bandKey: band.key,
    color: band.color,
    advisory: band.advisory,
  };
}
