import { CITIES, findCityByIdOrName } from '../data/cities.js';
import { computeIndianAQI } from '../utils/aqiCalculator.js';

/**
 * Aggregated privacy-preserving community dashboard & smart alerts.
 * Individual routines, addresses, or personal identifiers are NEVER exposed.
 */
const zonePledgeCounts = new Map([
  ['bhopal-tt-nagar', { householdsParticipating: 142, carpoolTripsWeek: 318, cleanCookingPledges: 119 }],
  ['bhopal-arera', { householdsParticipating: 196, carpoolTripsWeek: 440, cleanCookingPledges: 174 }],
  ['bhopal-kolar', { householdsParticipating: 128, carpoolTripsWeek: 265, cleanCookingPledges: 108 }],
  ['bhopal-govindpura', { householdsParticipating: 89, carpoolTripsWeek: 190, cleanCookingPledges: 76 }],
  ['bhopal-bairagarh', { householdsParticipating: 94, carpoolTripsWeek: 204, cleanCookingPledges: 82 }],
  ['bhopal-kamlapati', { householdsParticipating: 115, carpoolTripsWeek: 278, cleanCookingPledges: 98 }],
]);

export function getAggregatedCommunitySummary({ cityAqi, page = 1, limit = 4 }) {
  const city = findCityByIdOrName(cityAqi?.city?.id) || CITIES[0];
  const stations = cityAqi?.stations || [];

  const allZones = city.stations.map((st, idx) => {
    const liveSt = stations.find((s) => s.id === st.id);
    const aqi = liveSt ? liveSt.aqi : computeIndianAQI(st.samplePollutants).aqi;
    const pm25 = liveSt ? liveSt.pollutants?.pm25 : st.samplePollutants.pm25;
    const stats = zonePledgeCounts.get(st.id) || {
      householdsParticipating: 65 + idx * 14,
      carpoolTripsWeek: 130 + idx * 32,
      cleanCookingPledges: 54 + idx * 11,
    };

    return {
      zoneId: st.id,
      zoneName: st.zone,
      stationName: st.name,
      aqi,
      pm25,
      ...stats,
      estimatedCo2SavedKgWeek: Math.round(stats.carpoolTripsWeek * 1.4),
    };
  });

  const totalItems = allZones.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * limit;
  const paginatedZones = allZones.slice(start, start + limit);

  const totals = allZones.reduce(
    (acc, z) => ({
      households: acc.households + z.householdsParticipating,
      carpoolTrips: acc.carpoolTrips + z.carpoolTripsWeek,
      cleanCooking: acc.cleanCooking + z.cleanCookingPledges,
      co2SavedKg: acc.co2SavedKg + z.estimatedCo2SavedKgWeek,
    }),
    { households: 0, carpoolTrips: 0, cleanCooking: 0, co2SavedKg: 0 }
  );

  return {
    city: { id: city.id, name: city.name, state: city.state },
    privacyPolicy:
      'Aggregated neighborhood statistics only — individual family profiles, routines, and identities remain strictly private.',
    totals,
    pagination: {
      page: safePage,
      limit,
      totalItems,
      totalPages,
    },
    zones: paginatedZones,
  };
}

export function recordCommunityPledge({ zoneId, pledgeType }) {
  const existing = zonePledgeCounts.get(zoneId) || {
    householdsParticipating: 70,
    carpoolTripsWeek: 150,
    cleanCookingPledges: 60,
  };
  const updated = { ...existing };
  updated.householdsParticipating += 1;
  if (pledgeType === 'carpool') updated.carpoolTripsWeek += 4;
  if (pledgeType === 'clean_cooking') updated.cleanCookingPledges += 1;
  zonePledgeCounts.set(zoneId, updated);
  return { zoneId, ...updated };
}

export function generateCityAlerts({ aqiData, forecast }) {
  const alerts = [];
  const aqi = aqiData?.aqi ?? 140;
  const wind = aqiData?.weather?.windKmh ?? 8;
  const city = aqiData?.city?.name || 'Bhopal';

  if (aqi > 200) {
    alerts.push({
      id: 'alert-high-aqi',
      severity: 'high',
      title: `Poor Air Quality Active in ${city} (AQI ${aqi})`,
      detail: 'Move outdoor exercise indoors and wear a snug N95 mask on open transit.',
      source: aqiData.source,
      timestamp: aqiData.stationTimestamp,
    });
  } else if (aqi > 100) {
    alerts.push({
      id: 'alert-moderate-aqi',
      severity: 'medium',
      title: `Moderate Air Advisory in ${city} (AQI ${aqi})`,
      detail: 'Children and older adults should pace prolonged outdoor exertion.',
      source: aqiData.source,
      timestamp: aqiData.stationTimestamp,
    });
  }

  if (wind < 6.5) {
    alerts.push({
      id: 'alert-low-wind',
      severity: 'medium',
      title: `Low Wind Dispersion (${wind} km/h)`,
      detail: 'Calm surface winds can trap evening traffic & cooking emissions near ground level.',
      source: aqiData.weather?.source || 'Open-Meteo',
      timestamp: aqiData.weather?.observedAt || aqiData.stationTimestamp,
    });
  }

  const maxForecast =
    forecast?.status === 'ok' && forecast.points?.length
      ? Math.max(...forecast.points.slice(0, 24).map((p) => p.aqi))
      : null;

  if (maxForecast && maxForecast > Math.max(180, aqi + 20)) {
    alerts.push({
      id: 'alert-forecast-spike',
      severity: 'medium',
      title: `Projected Next-24h Peak up to AQI ${maxForecast}`,
      detail: 'Plan outdoor errands during midday breeze windows before evening peak.',
      source: 'ML Forecast Service',
      timestamp: forecast.generated_at,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'alert-clear',
      severity: 'low',
      title: `${city} Air Quality Currently Favorable (AQI ${aqi})`,
      detail: 'Standard outdoor routines are suitable; keep monitoring evening updates.',
      source: aqiData.source,
      timestamp: aqiData.stationTimestamp,
    });
  }

  return { alerts };
}
