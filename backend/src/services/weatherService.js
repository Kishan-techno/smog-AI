import { appCache } from '../config/cache.js';
import { env } from '../config/env.js';
import { CircuitBreaker, fetchJsonWithRetry } from '../utils/httpClient.js';

const weatherBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 60_000 });

function getSampleWeather(city) {
  // Realistic seasonal baseline for Indian cities when offline
  const byCity = {
    bhopal: { tempC: 24.5, humidityPct: 54, windKmh: 9.4, windDirDeg: 310, pressureHpa: 1014 },
    delhi: { tempC: 21.8, humidityPct: 62, windKmh: 5.2, windDirDeg: 295, pressureHpa: 1016 },
    indore: { tempC: 25.1, humidityPct: 50, windKmh: 11.2, windDirDeg: 300, pressureHpa: 1013 },
    mumbai: { tempC: 29.2, humidityPct: 71, windKmh: 14.8, windDirDeg: 270, pressureHpa: 1011 },
    bengaluru: { tempC: 24.0, humidityPct: 58, windKmh: 12.6, windDirDeg: 95, pressureHpa: 1015 },
    lucknow: { tempC: 22.4, humidityPct: 64, windKmh: 6.1, windDirDeg: 290, pressureHpa: 1015 },
    jaipur: { tempC: 23.7, humidityPct: 44, windKmh: 10.1, windDirDeg: 315, pressureHpa: 1014 },
    pune: { tempC: 25.4, humidityPct: 52, windKmh: 12.0, windDirDeg: 265, pressureHpa: 1013 },
  };
  const base = byCity[city.id] || byCity.bhopal;
  return {
    ...base,
    dispersionRating: computeDispersionRating(base.windKmh, base.humidityPct),
    source: 'Sample Seasonal Baseline',
    dataQuality: 'sample',
    observedAt: new Date().toISOString(),
  };
}

export function computeDispersionRating(windKmh, humidityPct) {
  if (windKmh >= 14 && humidityPct < 65) return { label: 'Good Dispersion', level: 'good' };
  if (windKmh >= 8) return { label: 'Moderate Dispersion', level: 'moderate' };
  return { label: 'Low Dispersion (Trapping Risk)', level: 'poor' };
}

export async function getCityWeather(city) {
  const cacheKey = `weather:${city.id}`;
  const freshTtlMs = env.WEATHER_CACHE_TTL_SECONDS * 1000;

  const result = await appCache.getOrFetch(cacheKey, {
    freshTtlMs,
    fetcher: async () => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure&timezone=Asia%2FKolkata`;
      const payload = await fetchJsonWithRetry(url, {
        timeoutMs: env.NODE_ENV === 'test' ? 1500 : 2800,
        retries: env.NODE_ENV === 'test' ? 0 : 1,
        breaker: weatherBreaker,
      });
      const cur = payload.current;
      if (!cur) throw new Error('Open-Meteo current block missing');

      const windKmh = Number(cur.wind_speed_10m ?? 8);
      const humidityPct = Number(cur.relative_humidity_2m ?? 55);

      return {
        tempC: Math.round(Number(cur.temperature_2m) * 10) / 10,
        humidityPct: Math.round(humidityPct),
        windKmh: Math.round(windKmh * 10) / 10,
        windDirDeg: Math.round(Number(cur.wind_direction_10m ?? 0)),
        pressureHpa: Math.round(Number(cur.surface_pressure ?? 1013)),
        dispersionRating: computeDispersionRating(windKmh, humidityPct),
        source: 'Open-Meteo Weather API',
        dataQuality: 'live',
        observedAt: cur.time ? new Date(cur.time).toISOString() : new Date().toISOString(),
      };
    },
    fallback: () => getSampleWeather(city),
  });

  const data = { ...result.data };
  if (result.cacheState === 'hit-stale' && data.dataQuality === 'live') {
    data.dataQuality = 'stale';
  }
  return {
    ...data,
    cacheState: result.cacheState,
    cachedAt: result.cachedAt,
  };
}
