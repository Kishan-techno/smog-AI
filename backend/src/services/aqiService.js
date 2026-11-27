import { appCache } from '../config/cache.js';
import { env } from '../config/env.js';
import { CITIES, findCityByIdOrName, findNearestCity, haversineKm } from '../data/cities.js';
import { computeIndianAQI } from '../utils/aqiCalculator.js';
import { CircuitBreaker, fetchJsonWithRetry } from '../utils/httpClient.js';
import { getCityWeather } from './weatherService.js';
import { AqiSnapshotModel } from '../repositories/models.js';
import { isDbConnected } from '../config/db.js';
import { logger } from '../config/logger.js';

const aqiBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 60_000 });

function buildSampleCityAqi(city) {
  const now = new Date().toISOString();
  const stations = city.stations.map((st) => {
    const aqiData = computeIndianAQI(st.samplePollutants);
    return {
      id: st.id,
      name: st.name,
      zone: st.zone,
      lat: st.lat,
      lon: st.lon,
      pollutants: st.samplePollutants,
      ...aqiData,
      source: 'Sample CPCB-Calibrated Station Baseline',
      dataQuality: 'sample',
      timestamp: now,
    };
  });

  const avgPollutants = averagePollutants(stations.map((s) => s.pollutants));
  const cityAqi = computeIndianAQI(avgPollutants);

  return {
    city: { id: city.id, name: city.name, state: city.state, lat: city.lat, lon: city.lon },
    ...cityAqi,
    pollutants: avgPollutants,
    stations,
    source: 'Sample CPCB-Calibrated Baseline (Offline Demo)',
    dataQuality: 'sample',
    stationTimestamp: now,
  };
}

function averagePollutants(list) {
  const keys = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3'];
  const out = {};
  for (const key of keys) {
    const vals = list.map((p) => p[key]).filter((v) => v != null && !Number.isNaN(v));
    out[key] = vals.length
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
      : null;
  }
  return out;
}

async function fetchOpenMeteoAirQuality(city) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone&timezone=Asia%2FKolkata`;
  const data = await fetchJsonWithRetry(url, {
    timeoutMs: env.NODE_ENV === 'test' ? 1500 : 2800,
    retries: env.NODE_ENV === 'test' ? 0 : 1,
    breaker: aqiBreaker,
  });
  const cur = data?.current;
  if (!cur || cur.pm2_5 == null) {
    throw new Error('Open-Meteo Air Quality missing current metrics');
  }
  return {
    pollutants: {
      pm25: Math.round(Number(cur.pm2_5) * 10) / 10,
      pm10: Math.round(Number(cur.pm10 ?? cur.pm2_5 * 1.6) * 10) / 10,
      no2: Math.round(Number(cur.nitrogen_dioxide ?? 25) * 10) / 10,
      so2: Math.round(Number(cur.sulphur_dioxide ?? 10) * 10) / 10,
      // Open-Meteo CO is in ug/m3; convert to mg/m3 for CPCB NAQI table
      co: Math.round((Number(cur.carbon_monoxide ?? 800) / 1000) * 100) / 100,
      o3: Math.round(Number(cur.ozone ?? 40) * 10) / 10,
    },
    timestamp: cur.time ? new Date(cur.time).toISOString() : new Date().toISOString(),
    source: 'Open-Meteo Copernicus CAMS',
  };
}

async function fetchOptionalWaqiCity(city) {
  if (!env.WAQI_TOKEN) return null;
  const url = `https://api.waqi.info/feed/${encodeURIComponent(city.name)}/?token=${encodeURIComponent(env.WAQI_TOKEN)}`;
  const res = await fetchJsonWithRetry(url, { timeoutMs: 4000, retries: 1 });
  if (res?.status !== 'ok' || !res.data?.iaqi) return null;
  const iaqi = res.data.iaqi;
  return {
    pm25: iaqi.pm25?.v ?? null,
    pm10: iaqi.pm10?.v ?? null,
    no2: iaqi.no2?.v ?? null,
    so2: iaqi.so2?.v ?? null,
    co: iaqi.co?.v ?? null,
    o3: iaqi.o3?.v ?? null,
    stationName: res.data.city?.name,
    timestamp: res.data.time?.iso || new Date().toISOString(),
    source: 'WAQI / CPCB Feed',
  };
}

async function fetchLiveCityAqi(city) {
  const [openMeteoRes, waqiRes] = await Promise.allSettled([
    fetchOpenMeteoAirQuality(city),
    fetchOptionalWaqiCity(city),
  ]);

  if (openMeteoRes.status !== 'fulfilled' && waqiRes.status !== 'fulfilled') {
    throw new Error('All live AQI providers failed');
  }

  const baseLive = openMeteoRes.status === 'fulfilled' ? openMeteoRes.value : null;
  const waqi = waqiRes.status === 'fulfilled' ? waqiRes.value : null;

  const anchorPollutants = baseLive
    ? baseLive.pollutants
    : {
        pm25: waqi.pm25 ?? 80,
        pm10: waqi.pm10 ?? 140,
        no2: waqi.no2 ?? 35,
        so2: waqi.so2 ?? 12,
        co: waqi.co ?? 1.0,
        o3: waqi.o3 ?? 38,
      };

  const sourceLabel = waqi && baseLive
    ? `${waqi.source} + ${baseLive.source}`
    : baseLive
      ? baseLive.source
      : waqi.source;

  const timestamp = (waqi?.timestamp || baseLive?.timestamp || new Date().toISOString());

  // Apply realistic spatial variance across city stations anchored to live regional feed
  const citySampleAvg = averagePollutants(city.stations.map((s) => s.samplePollutants));
  const stations = city.stations.map((st) => {
    const stationPollutants = {};
    for (const k of ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3']) {
      const ratio =
        citySampleAvg[k] && citySampleAvg[k] > 0
          ? st.samplePollutants[k] / citySampleAvg[k]
          : 1;
      const clampedRatio = Math.max(0.75, Math.min(1.32, ratio));
      stationPollutants[k] =
        k === 'co'
          ? Math.round(anchorPollutants[k] * clampedRatio * 100) / 100
          : Math.round(anchorPollutants[k] * clampedRatio * 10) / 10;
    }
    const computed = computeIndianAQI(stationPollutants);
    return {
      id: st.id,
      name: st.name,
      zone: st.zone,
      lat: st.lat,
      lon: st.lon,
      pollutants: stationPollutants,
      ...computed,
      source: sourceLabel,
      dataQuality: 'live',
      timestamp,
    };
  });

  const cityAvg = averagePollutants(stations.map((s) => s.pollutants));
  const cityAqi = computeIndianAQI(cityAvg);

  // Persist snapshot asynchronously only when MongoDB is connected
  if (isDbConnected()) {
    AqiSnapshotModel.create({
      cityId: city.id,
      aqi: cityAqi.aqi,
      dominantPollutant: cityAqi.dominantPollutant,
      dataQuality: 'live',
      source: sourceLabel,
    }).catch((err) => logger.warn('Failed to store AQI snapshot', { error: err.message }));
  }

  return {
    city: { id: city.id, name: city.name, state: city.state, lat: city.lat, lon: city.lon },
    ...cityAqi,
    pollutants: cityAvg,
    stations,
    source: sourceLabel,
    dataQuality: 'live',
    stationTimestamp: timestamp,
  };
}

export async function getCityAirQuality({ cityQuery = 'bhopal', lat, lon } = {}) {
  let city = findCityByIdOrName(cityQuery);
  let locationHint = null;

  if (lat != null && lon != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lon))) {
    const nearest = findNearestCity(Number(lat), Number(lon));
    city = nearest.city;
    locationHint = {
      matchedCity: nearest.city.name,
      approxDistanceKm: nearest.distanceKm,
      privacyNote: 'Approximate city zone matched; exact coordinates are not stored.',
    };
  }

  if (!city) {
    city = CITIES[0]; // Default to Bhopal
  }

  const cacheKey = `aqi:${city.id}`;
  const freshTtlMs = env.AQI_CACHE_TTL_SECONDS * 1000;

  // Fetch AQI and weather in parallel for sub-200ms cached / fast live responses
  const [aqiResult, weather] = await Promise.all([
    appCache.getOrFetch(cacheKey, {
      freshTtlMs,
      fetcher: () => fetchLiveCityAqi(city),
      fallback: () => buildSampleCityAqi(city),
    }),
    getCityWeather(city),
  ]);

  const payload = { ...aqiResult.data };
  if (aqiResult.cacheState === 'hit-stale' && payload.dataQuality === 'live') {
    payload.dataQuality = 'stale';
    payload.stations = payload.stations.map((s) => ({ ...s, dataQuality: 'stale' }));
  }

  if (lat != null && lon != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lon))) {
    payload.stations = payload.stations
      .map((s) => ({
        ...s,
        distanceKm: Math.round(haversineKm(Number(lat), Number(lon), s.lat, s.lon) * 10) / 10,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  return {
    ...payload,
    weather,
    locationHint,
    cacheState: aqiResult.cacheState,
    cachedAt: aqiResult.cachedAt,
    isStale: aqiResult.isStale,
  };
}

export function listSupportedCities() {
  return CITIES.map((c) => ({
    id: c.id,
    name: c.name,
    state: c.state,
    lat: c.lat,
    lon: c.lon,
    stationCount: c.stations.length,
  }));
}
