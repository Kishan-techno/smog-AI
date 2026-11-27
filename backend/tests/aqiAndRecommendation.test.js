import { describe, expect, it } from 'vitest';
import { computeIndianAQI, computeSubIndex, getAqiBand } from '../src/utils/aqiCalculator.js';
import { generateDailyActionPlan } from '../src/services/recommendationService.js';
import { routineSchema } from '../src/validators/schemas.js';

describe('CPCB NAQI Calculator', () => {
  it('computes accurate sub-indices and dominant pollutant', () => {
    const res = computeIndianAQI({ pm25: 94, pm10: 158, no2: 42, so2: 14, co: 1.1, o3: 38 });
    expect(res.aqi).toBeGreaterThanOrEqual(201);
    expect(res.aqi).toBeLessThanOrEqual(300);
    expect(res.dominantPollutant).toBe('PM25');
    expect(res.category).toBe('Poor');
  });

  it('handles zero and missing pollutant values safely', () => {
    expect(computeSubIndex('pm25', null)).toBeNull();
    expect(computeSubIndex('pm25', -5)).toBeNull();
    expect(getAqiBand(35).label).toBe('Good');
    expect(getAqiBand(450).label).toBe('Severe');
  });
});

describe('Recommendation Engine', () => {
  const baseRoutine = routineSchema.parse({
    cityId: 'bhopal',
    commuteMode: 'two_wheeler',
    outdoorMinutes: 60,
    hasChildrenOrElderly: true,
  });

  it('generates explainable recommendations with source, timestamp, confidence, and assumptions', () => {
    const aqiData = {
      city: { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh' },
      aqi: 225,
      category: 'Poor',
      color: '#F97316',
      dominantPollutant: 'PM25',
      pollutants: { pm25: 98, pm10: 162, no2: 45 },
      weather: { windKmh: 6.2, humidityPct: 68, dispersionRating: { label: 'Low Dispersion' } },
      source: 'Open-Meteo Copernicus CAMS',
      stationTimestamp: '2026-11-27T07:00:00.000Z',
      dataQuality: 'live',
    };

    const plan = generateDailyActionPlan({ aqiData, routine: baseRoutine });
    expect(plan.items).toHaveLength(4);
    expect(plan.disclaimer).toMatch(/not a medical diagnosis/i);
    expect(plan.confidence.level).toBe('high');
    for (const item of plan.items) {
      expect(item.dataSource).toBe('Open-Meteo Copernicus CAMS');
      expect(item.stationTimestamp).toBe('2026-11-27T07:00:00.000Z');
      expect(item.assumptions.length).toBeGreaterThan(0);
    }
    const schoolItem = plan.items.find((i) => i.id === 'school-morning');
    expect(schoolItem.priority).toBe('high');
  });

  it('validates routine input and rejects invalid time formats', () => {
    const parsed = routineSchema.safeParse({ schoolStart: '25:99' });
    expect(parsed.success).toBe(false);
  });
});
