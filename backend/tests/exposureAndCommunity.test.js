import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { calculateExposureProxy } from '../src/services/exposureService.js';

const app = createApp();

describe('Phase 4 Exposure Proxy, Community & Alerts', () => {
  it('calculateExposureProxy computes concentration*time sum and enforces <= 24h', () => {
    const res = calculateExposureProxy({
      ambientPm25: 80,
      homeHours: 14,
      schoolOrWorkHours: 6,
      commuteHours: 2,
      outdoorHours: 2,
      wearsN95OnCommute: true,
    });
    expect(res.totalHours).toBe(24);
    expect(res.environments).toHaveLength(4);
    expect(res.totalExposureProxy).toBeGreaterThan(0);
    expect(res.disclaimer).toMatch(/NOT an inhaled biological dose/i);

    expect(() =>
      calculateExposureProxy({ homeHours: 20, schoolOrWorkHours: 6 })
    ).toThrow(/exceed 24/i);
  });

  it('POST /api/exposure/calculate validates total hours <= 24', async () => {
    const bad = await request(app).post('/api/exposure/calculate').send({
      homeHours: 18,
      schoolOrWorkHours: 8,
      commuteHours: 2,
      outdoorHours: 2,
    });
    expect(bad.status).toBe(400);

    const ok = await request(app).post('/api/exposure/calculate').send({
      city: 'bhopal',
      ambientPm25: 75,
      homeHours: 14,
      schoolOrWorkHours: 6.5,
      commuteHours: 1.5,
      outdoorHours: 2,
    });
    expect(ok.status).toBe(200);
    expect(ok.body.environments).toHaveLength(4);
  });

  it('GET /api/community/summary returns aggregated ward stats only (no PII) & supports pledges', async () => {
    const res = await request(app).get('/api/community/summary?city=bhopal&page=1&limit=3');
    expect(res.status).toBe(200);
    expect(res.body.zones).toHaveLength(3);
    expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(2);
    expect(res.body.privacyPolicy).toMatch(/Aggregated neighborhood statistics only/i);

    const pledge = await request(app).post('/api/community/pledge').send({
      zoneId: 'bhopal-tt-nagar',
      pledgeType: 'carpool',
    });
    expect(pledge.status).toBe(201);
    expect(pledge.body.pledge.zoneId).toBe('bhopal-tt-nagar');
  });

  it('GET /api/alerts returns active environmental alerts', async () => {
    const res = await request(app).get('/api/alerts?city=bhopal');
    expect(res.status).toBe(200);
    expect(res.body.alerts.length).toBeGreaterThanOrEqual(1);
  }, 10000);
});
