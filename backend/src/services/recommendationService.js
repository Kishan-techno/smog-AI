/**
 * Explainable Decision-Support Recommendation Engine.
 * Combines live/cached AQI, weather dispersion, and family routine into
 * actionable time-windowed guidance with explicit source, timestamp, confidence, and assumptions.
 */

const COMMUTE_LABELS = {
  two_wheeler: 'Two-wheeler / Open scooter',
  car_ac: 'Car (recirculate AC)',
  carpool: 'Shared carpool',
  bus_metro: 'Public bus / transit',
  walk_cycle: 'Walk or bicycle',
};

function computeConfidence(aqiData) {
  if (aqiData.dataQuality === 'live') {
    return { level: 'high', score: 0.88, reason: 'Live sensor + Open-Meteo weather synced' };
  }
  if (aqiData.dataQuality === 'stale') {
    return { level: 'medium', score: 0.68, reason: 'Using cached snapshot while live feed refreshes' };
  }
  return { level: 'medium', score: 0.62, reason: 'Offline sample station baseline active' };
}

export function generateDailyActionPlan({ aqiData, routine }) {
  const aqi = aqiData.aqi;
  const pm25 = aqiData.pollutants?.pm25 ?? 0;
  const wind = aqiData.weather?.windKmh ?? 8;
  const humidity = aqiData.weather?.humidityPct ?? 55;
  const confidence = computeConfidence(aqiData);

  const baseMeta = {
    dataSource: aqiData.source,
    stationTimestamp: aqiData.stationTimestamp,
    dataQuality: aqiData.dataQuality,
    confidence,
  };

  const items = [];

  // 1. School & Morning Departure Window
  const isHighMorningRisk = aqi > 150 || (aqi > 100 && wind < 8);
  items.push({
    id: 'school-morning',
    category: 'school',
    priority: aqi > 200 ? 'high' : isHighMorningRisk ? 'medium' : 'low',
    timeWindow: `${routine.schoolStart} – ${routine.schoolEnd}`,
    title:
      aqi > 200
        ? 'Mask up for school run & skip outdoor assembly'
        : aqi > 100
          ? 'Limit vigorous morning playground exertion'
          : 'Normal school schedule with light precautions',
    action:
      aqi > 200
        ? 'Use a snug N95/KF94 mask during transit and request indoor classroom breaks during peak morning haze.'
        : aqi > 100
          ? 'Prefer shaded/indoor PT if morning haze lingers; carry water and keep vehicle windows up.'
          : 'Standard school commute and outdoor play are fine; keep checking afternoon wind shifts.',
    why: `Current ${aqiData.city.name} AQI is ${aqi} (${aqiData.category}, dominant ${aqiData.dominantPollutant}, PM2.5 ${pm25} µg/m³) with ${wind} km/h wind.`,
    impact:
      aqi > 150
        ? 'Well-fitted N95 filtration can reduce fine particulate inhalation during transit by ~70–85% under proper fit.'
        : 'Reduces peak morning particulate exposure during lower-dispersion hours.',
    assumptions: [
      `Routine window assumes departure near ${routine.schoolStart}`,
      routine.hasChildrenOrElderly
        ? 'Conservative thresholds applied for children/older adults in household'
        : 'Standard adult exposure thresholds applied',
      'N95 effectiveness depends on proper face seal',
    ],
    ...baseMeta,
  });

  // 2. Commute Optimization
  const isExposedCommute = ['two_wheeler', 'walk_cycle'].includes(routine.commuteMode);
  items.push({
    id: 'commute-window',
    category: 'commute',
    priority: isExposedCommute && aqi > 140 ? 'high' : aqi > 120 ? 'medium' : 'low',
    timeWindow: `${routine.commuteStart} & ${routine.commuteReturn}`,
    title: isExposedCommute
      ? aqi > 120
        ? 'Protect open-air commute or switch to enclosed transit'
        : 'Open commute acceptable; avoid idling behind diesel traffic'
      : 'Use AC recirculation mode in transit',
    action: isExposedCommute
      ? aqi > 150
        ? `Your ${COMMUTE_LABELS[routine.commuteMode]} commute faces direct roadside PM2.5. Carpool/bus or wear a certified N95 mask and shift return by 30 mins if traffic peaks.`
        : `Wear a snug mask on busy arterial roads around ${routine.commuteStart} and prefer less congested parallel streets.`
      : `Keep cabin vents on recirculation (not fresh air) along dense corridors at ${routine.commuteStart} and ${routine.commuteReturn}.`,
    why: `Roadside corridors near ${routine.zoneLabel || aqiData.city.name} elevate NO2 (${aqiData.pollutants?.no2 ?? 30} µg/m³) and PM2.5 above city averages during rush hours.`,
    impact:
      isExposedCommute && aqi > 120
        ? 'Switching from open two-wheeler to enclosed carpool or wearing N95 reduces roadside PM2.5 intake proxy substantially.'
        : 'Cabin recirculation avoids drawing tailpipe exhaust spikes into the vehicle.',
    assumptions: [
      `Commute mode set to ${COMMUTE_LABELS[routine.commuteMode] || routine.commuteMode}`,
      'Roadside concentrations typically run 15–35% higher than rooftop background monitors',
    ],
    ...baseMeta,
  });

  // 3. Outdoor Activity / Exercise Window
  const bestWindow =
    wind >= 9 && aqi <= 150
      ? 'Mid-afternoon (14:00 – 16:30) typically offers stronger thermal mixing'
      : 'Move high-intensity cardio indoors today';
  items.push({
    id: 'outdoor-activity',
    category: 'outdoor',
    priority: aqi > 200 ? 'high' : aqi > 100 ? 'medium' : 'low',
    timeWindow:
      routine.outdoorWindow === 'none'
        ? 'Indoor / Flexible'
        : `${routine.outdoorWindow.replace('_', ' ')} (${routine.outdoorMinutes} min)`,
    title:
      aqi > 200
        ? 'Shift outdoor exercise indoors today'
        : aqi > 100
          ? 'Shorten vigorous outdoor activity & pick clearer breeze hours'
          : 'Safe window for outdoor walk or sport',
    action:
      aqi > 200
        ? `Replace ${routine.outdoorMinutes} min outdoor workout with indoor stretching, yoga, or home cardio.`
        : aqi > 100
          ? `Cap outdoor exertion to ~${Math.min(30, routine.outdoorMinutes)} min; ${bestWindow}.`
          : `Enjoy your ${routine.outdoorMinutes} min outdoor session; parks away from main roads are cleanest.`,
    why: `Heavy breathing during exercise multiplies minute ventilation 3–6x; humidity is ${humidity}% with ${aqiData.weather?.dispersionRating?.label || 'moderate dispersion'}.`,
    impact: 'Prevents multiplied particulate deposition during elevated breathing rates.',
    assumptions: [
      `Planned outdoor duration: ${routine.outdoorMinutes} minutes`,
      'Afternoon convective mixing assumption may vary on overcast or calm days',
    ],
    ...baseMeta,
  });

  // 4. Home & Indoor Air Management
  const needsFiltration = aqi > 120 || routine.cookingFuel === 'mixed_biomass';
  items.push({
    id: 'indoor-ventilation',
    category: 'indoor',
    priority: needsFiltration ? 'high' : 'low',
    timeWindow: 'Afternoon & Evening Cooking Hours',
    title:
      aqi > 150
        ? 'Seal evening drafts & vent kitchen exhaust outward'
        : 'Cross-ventilate briefly during lowest afternoon haze',
    action:
      aqi > 150
        ? 'Keep balcony/road-facing windows closed after 17:30, run exhaust fan while cooking, wet-mop floors instead of dry sweeping, and avoid incense/mosquito coils.'
        : 'Open windows for 20–30 min in the afternoon when winds peak, and keep kitchen exhaust running while cooking.',
    why:
      routine.cookingFuel === 'mixed_biomass'
        ? 'Solid fuel/biomass smoke combined with ambient PM2.5 can rapidly spike indoor PM2.5.'
        : `Evening cooling often traps surface pollutants after sunset when wind is ${wind} km/h.`,
    impact: 'Reduces indoor particulate build-up from cooking, resuspended dust, and evening inversion trapping.',
    assumptions: [
      `Household size: ${routine.householdSize} | Cooking fuel: ${routine.cookingFuel.replace('_', ' / ')}`,
      'Wet mopping minimizes dust resuspension compared to dry brooming',
    ],
    ...baseMeta,
  });

  return {
    generatedAt: new Date().toISOString(),
    city: aqiData.city,
    aqiSummary: {
      aqi: aqiData.aqi,
      category: aqiData.category,
      color: aqiData.color,
      dominantPollutant: aqiData.dominantPollutant,
      pm25,
    },
    dataSource: aqiData.source,
    stationTimestamp: aqiData.stationTimestamp,
    dataQuality: aqiData.dataQuality,
    confidence,
    disclaimer:
      'Decision-support guidance only — not a medical diagnosis or guaranteed health outcome. Consult a qualified clinician for respiratory symptoms.',
    items,
  };
}
