import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { runWhatIfSimulation } from '../src/services/simulatorService.js';

const app = createApp();

describe('Phase 3 Trends, Forecast & Simulator', () => {
  it('runWhatIfSimulation calculates reduced exposure proxy and explicit assumptions', () => {
    const res = runWhatIfSimulation({
      baselinePm25: 100,
      commuteMode: 'private_open',
      simulatedCommuteMode: 'carpool',
      baselineExercise: 'outdoor_peak',
      simulatedExercise: 'indoor',
      indoorExhaustFan: true,
      indoorWetMop: true,
      avoidIncenseBiomass: true,
      n95MaskOnCommute: true,
    });
    expect(res.simulatedTotalProxy).toBeLessThan(res.baselineTotalProxy);
    expect(res.reductionPct).toBeGreaterThan(20);
    expect(res.assumptions.some((a) => /NOT an internal medical inhaled dose/i.test(a))).toBe(true);
  });

  it('GET /api/forecast returns 24-48h points and confidence when telemetry exists', async () => {
    const res = await request(app).get('/api/forecast?city=bhopal&hours=48');
    expect(res.status).toBe(200);
    expect(res.body.history.length).toBeGreaterThanOrEqual(6);
    expect(res.body.forecast.status).toBe('ok');
    expect(res.body.forecast.points).toHaveLength(48);
    expect(res.body.forecast.confidence.score).toBeGreaterThan(0.3);
  }, 10000);

  it('GET /api/forecast?simulateMissing=true returns "forecast unavailable" instead of fake numbers', async () => {
    const res = await request(app).get('/api/forecast?city=bhopal&simulateMissing=true');
    expect(res.status).toBe(200);
    expect(res.body.forecast.status).toBe('forecast unavailable');
    expect(res.body.forecast.points).toEqual([]);
  });

  it('POST /api/simulator/run validates and returns simulation breakdown', async () => {
    const res = await request(app).post('/api/simulator/run').send({
      city: 'bhopal',
      baselinePm25: 90,
      commuteMode: 'private_open',
      simulatedCommuteMode: 'carpool',
      n95MaskOnCommute: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.breakdown).toHaveLength(3);
    expect(res.body.exposureProxySaved).toBeGreaterThan(0);
  });
});
