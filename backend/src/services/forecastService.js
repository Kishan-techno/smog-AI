import { appCache } from '../config/cache.js';
import { env } from '../config/env.js';
import { findCityByIdOrName, CITIES } from '../data/cities.js';
import { computeIndianAQI } from '../utils/aqiCalculator.js';
import { fetchJsonWithRetry } from '../utils/httpClient.js';
import { getCityAirQuality } from './aqiService.js';
import { logger } from '../config/logger.js';

function buildSampleHistory(cityAqi, hours = 24) {
  const now = new Date();
  const baseAqi = cityAqi?.aqi || 145;
  const basePm25 = cityAqi?.pollutants?.pm25 || 72;
  const points = [];
  for (let i = hours - 1; i >= 0; i -= 1) {
    const dt = new Date(now.getTime() - i * 3600_000);
    const istHour = (dt.getUTCHours() + 5) % 24;
    const wave =
      istHour >= 7 && istHour <= 10
        ? 1.15
        : istHour >= 13 && istHour <= 16
          ? 0.82
          : istHour >= 19 && istHour <= 23
            ? 1.18
            : 0.96;
    points.push({
      timestamp: dt.toISOString(),
      aqi: Math.round(Math.max(15, Math.min(480, baseAqi * wave))),
      pm25: Math.round(Math.max(6, basePm25 * wave) * 10) / 10,
    });
  }
  return points;
}

async function fetchHourlyHistory(city) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&hourly=pm2_5,pm10,nitrogen_dioxide,ozone&past_days=2&forecast_days=1&timezone=Asia%2FKolkata`;
  const data = await fetchJsonWithRetry(url, {
    timeoutMs: env.NODE_ENV === 'test' ? 1500 : 3000,
    retries: env.NODE_ENV === 'test' ? 0 : 1,
  });

  const times = data?.hourly?.time || [];
  const pm25s = data?.hourly?.pm2_5 || [];
  const pm10s = data?.hourly?.pm10 || [];
  const no2s = data?.hourly?.nitrogen_dioxide || [];
  const o3s = data?.hourly?.ozone || [];

  const nowMs = Date.now();
  const points = [];
  for (let i = 0; i < times.length; i += 1) {
    const ts = new Date(times[i]);
    if (Number.isNaN(ts.getTime()) || ts.getTime() > nowMs) continue;
    if (pm25s[i] == null) continue;
    const calc = computeIndianAQI({
      pm25: pm25s[i],
      pm10: pm10s[i],
      no2: no2s[i],
      o3: o3s[i],
    });
    points.push({
      timestamp: ts.toISOString(),
      aqi: calc.aqi,
      pm25: Math.round(Number(pm25s[i]) * 10) / 10,
      pm10: pm10s[i] != null ? Math.round(Number(pm10s[i]) * 10) / 10 : null,
    });
  }

  if (points.length < 6) {
    throw new Error('Open-Meteo returned fewer than 6 historical points');
  }

  return {
    points: points.slice(-48),
    source: 'Open-Meteo Copernicus CAMS Hourly',
    dataQuality: 'live',
  };
}

async function callMlForecaster({ cityId, horizonHours, dataFreshness, history, weather }) {
  if (!env.ML_SERVICE_URL) {
    throw new Error('ML_SERVICE_URL not configured');
  }
  const mlBase = env.ML_SERVICE_URL.startsWith('http')
    ? env.ML_SERVICE_URL.replace(/\/+$/, '')
    : `https://${env.ML_SERVICE_URL.replace(/\/+$/, '')}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(`${mlBase}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city_id: cityId,
        horizon_hours: horizonHours,
        data_freshness: dataFreshness,
        history: history.map((p) => ({
          timestamp: p.timestamp,
          aqi: p.aqi,
          pm25: p.pm25,
        })),
        weather: {
          wind_kmh: weather?.windKmh ?? 8,
          humidity_pct: weather?.humidityPct ?? 55,
          temp_c: weather?.tempC ?? 24,
        },
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`ML service HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function localStatisticalFallback({ cityId, horizonHours, dataFreshness, history, weather }) {
  const valid = history.filter((p) => p.aqi != null && !Number.isNaN(p.aqi));
  if (valid.length < 6) {
    return {
      status: 'forecast unavailable',
      reason:
        'Insufficient recent hourly observations (need at least 6 points). Returning no synthetic values.',
      city_id: cityId,
      horizon_hours: horizonHours,
      confidence: null,
      data_freshness: dataFreshness,
      generated_at: new Date().toISOString(),
      points: [],
      assumptions: [],
    };
  }

  const recent = valid.slice(-12);
  const avgAqi = recent.reduce((acc, p) => acc + p.aqi, 0) / recent.length;
  const avgPm25 = recent.reduce((acc, p) => acc + (p.pm25 ?? p.aqi * 0.55), 0) / recent.length;
  const windFactor = (weather?.windKmh ?? 8) < 6 ? 1.08 : (weather?.windKmh ?? 8) > 14 ? 0.9 : 1.0;
  const lastTs = new Date(valid[valid.length - 1].timestamp).getTime();

  const points = [];
  for (let h = 1; h <= horizonHours; h += 1) {
    const dt = new Date(lastTs + h * 3600_000);
    const istHour = (dt.getUTCHours() + 5) % 24;
    const diurnal =
      istHour >= 7 && istHour <= 10
        ? 1.14
        : istHour >= 13 && istHour <= 16
          ? 0.81
          : istHour >= 19 && istHour <= 23
            ? 1.17
            : 0.98;
    const aqi = Math.round(Math.max(15, Math.min(480, avgAqi * diurnal * windFactor)));
    const band = Math.round(14 + h * 0.7);
    points.push({
      timestamp: dt.toISOString(),
      hour_offset: h,
      aqi,
      lower_aqi: Math.max(5, aqi - band),
      upper_aqi: Math.min(500, aqi + band),
      pm25: Math.round((aqi * (avgPm25 / Math.max(1, avgAqi))) * 10) / 10,
    });
  }

  return {
    status: 'ok',
    city_id: cityId,
    horizon_hours: horizonHours,
    confidence: {
      label: dataFreshness === 'live' ? 'medium' : 'low',
      score: dataFreshness === 'live' ? 0.72 : 0.56,
    },
    data_freshness: dataFreshness,
    generated_at: new Date().toISOString(),
    points,
    assumptions: [
      'Diurnal dispersion fallback curve active while Python ML service warms up.',
      'Uncertainty band widens monotonically across 24–48h horizon.',
    ],
  };
}

export async function getCityTrendsAndForecast({
  cityQuery = 'bhopal',
  horizonHours = 48,
  simulateMissing = false,
} = {}) {
  const city = findCityByIdOrName(cityQuery) || CITIES[0];
  const currentAqi = await getCityAirQuality({ cityQuery: city.id });

  if (simulateMissing) {
    const unavailable = await callMlForecaster({
      cityId: city.id,
      horizonHours,
      dataFreshness: 'unavailable',
      history: [],
      weather: currentAqi.weather,
    }).catch(() =>
      localStatisticalFallback({
        cityId: city.id,
        horizonHours,
        dataFreshness: 'unavailable',
        history: [],
        weather: currentAqi.weather,
      })
    );

    return {
      city: currentAqi.city,
      history: [],
      historySource: 'Unavailable (simulated missing telemetry)',
      dataQuality: 'unavailable',
      forecast: unavailable,
    };
  }

  const historyCacheKey = `history:${city.id}`;
  const histResult = await appCache.getOrFetch(historyCacheKey, {
    freshTtlMs: env.AQI_CACHE_TTL_SECONDS * 1000,
    fetcher: () => fetchHourlyHistory(city),
    fallback: () => ({
      points: buildSampleHistory(currentAqi, 24),
      source: 'Sample Diurnal Station History',
      dataQuality: 'sample',
    }),
  });

  const historyPoints = histResult.data.points;
  const dataQuality =
    histResult.cacheState === 'hit-stale' && histResult.data.dataQuality === 'live'
      ? 'stale'
      : histResult.data.dataQuality;

  let forecast;
  let forecastEngine = 'python-fastapi-ml';
  try {
    forecast = await callMlForecaster({
      cityId: city.id,
      horizonHours,
      dataFreshness: dataQuality,
      history: historyPoints,
      weather: currentAqi.weather,
    });
  } catch (err) {
    logger.warn('ML service unreachable; using node statistical forecast fallback', {
      error: err.message,
    });
    forecastEngine = 'node-statistical-fallback';
    forecast = localStatisticalFallback({
      cityId: city.id,
      horizonHours,
      dataFreshness: dataQuality,
      history: historyPoints,
      weather: currentAqi.weather,
    });
  }

  return {
    city: currentAqi.city,
    history: historyPoints.slice(-24),
    historySource: histResult.data.source,
    dataQuality,
    forecastEngine,
    forecast,
  };
}
