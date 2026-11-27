import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { appCache } from '../src/config/cache.js';

let app;

beforeAll(() => {
  appCache.clear();
  app = createApp();
});

afterAll(() => {
  appCache.clear();
});

describe('Phase 1 API Integration', () => {
  it('GET /api/health returns service status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('smog-saathi-api');
  });

  it('GET /api/aqi/cities includes Bhopal as default city', async () => {
    const res = await request(app).get('/api/aqi/cities');
    expect(res.status).toBe(200);
    expect(res.body.cities.some((c) => c.id === 'bhopal')).toBe(true);
  });

  it('GET /api/aqi/current returns Bhopal AQI, stations, weather, and serves cached response quickly', async () => {
    const first = await request(app).get('/api/aqi/current?city=bhopal');
    expect(first.status).toBe(200);
    expect(first.body.city.id).toBe('bhopal');
    expect(first.body.stations.length).toBeGreaterThanOrEqual(4);
    expect(first.body.weather).toBeDefined();

    const start = Date.now();
    const second = await request(app).get('/api/aqi/current?city=bhopal');
    const elapsed = Date.now() - start;
    expect(second.status).toBe(200);
    expect(second.body.cacheState).toBe('hit-fresh');
    expect(elapsed).toBeLessThan(200);
  }, 10000);

  it('PUT /api/routine validates input, saves routine, and returns personalized plan', async () => {
    const invalid = await request(app)
      .put('/api/routine')
      .send({ schoolStart: 'invalid' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');

    const res = await request(app)
      .put('/api/routine')
      .set('x-session-id', 'test-session-bhopal-1')
      .send({
        cityId: 'bhopal',
        zoneLabel: 'Arera Colony',
        schoolStart: '08:00',
        schoolEnd: '14:00',
        commuteMode: 'carpool',
        commuteStart: '08:45',
        commuteReturn: '18:30',
        outdoorWindow: 'midday',
        outdoorMinutes: 30,
        householdSize: 4,
        hasChildrenOrElderly: true,
        cookingFuel: 'lpg_electric',
      });
    expect(res.status).toBe(200);
    expect(res.body.routine.zoneLabel).toBe('Arera Colony');
    expect(res.body.plan.items).toHaveLength(4);
  });

  it('POST /api/auth/register & login issue JWT and protect /api/auth/me', async () => {
    const unauth = await request(app).get('/api/auth/me');
    expect(unauth.status).toBe(401);

    const email = `family_${Date.now()}@example.com`;
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Aarav Sharma',
      email,
      password: 'password123',
      preferredCity: 'bhopal',
    });
    expect(reg.status).toBe(201);
    expect(reg.body.token).toBeTruthy();

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
  });
});
