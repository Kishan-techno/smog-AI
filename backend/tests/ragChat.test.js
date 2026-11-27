import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { detectLanguage, retrieveGuidanceDocs } from '../src/services/ragService.js';

const app = createApp();

describe('Phase 2 Grounded RAG Chat Assistant', () => {
  it('detects English, Hindi Devanagari, and Hinglish accurately', () => {
    expect(detectLanguage('Can kids play outside today?', 'auto')).toBe('en');
    expect(detectLanguage('क्या आज बच्चों के लिए बाहर खेलना सही है?', 'auto')).toBe('hi');
    expect(detectLanguage('Bhopal mein aaj morning walk karna safe hai kya?', 'auto')).toBe('hinglish');
  });

  it('retrieves relevant CPCB/WHO/MoHFW docs for mask & school queries', () => {
    const maskDocs = retrieveGuidanceDocs('N95 mask for two wheeler commute', { cityId: 'bhopal' });
    expect(maskDocs.some((d) => d.id === 'ICMR-MASK-COMMUTE')).toBe(true);

    const schoolDocs = retrieveGuidanceDocs('children playground outdoor sports', { cityId: 'bhopal' });
    expect(schoolDocs.some((d) => d.id === 'MOHFW-SCHOOL-KIDS')).toBe(true);
  });

  it('POST /api/chat returns grounded bilingual answer with citations and disclaimer', async () => {
    const res = await request(app).post('/api/chat').send({
      message: 'Bhopal mein aaj morning walk karna safe hai?',
      city: 'bhopal',
      language: 'hinglish',
    });
    expect(res.status).toBe(200);
    expect(res.body.language).toBe('hinglish');
    expect(res.body.citations.length).toBeGreaterThanOrEqual(2);
    expect(res.body.sensorContext.city).toBe('Bhopal');
    expect(res.body.disclaimer).toMatch(/not a medical diagnosis/i);
  }, 10000);

  it('POST /api/chat/stream emits SSE meta, token, and done events quickly', async () => {
    const res = await request(app).post('/api/chat/stream').send({
      message: 'स्कूल के लिए कौन सा मास्क पहनें?',
      city: 'bhopal',
      language: 'hi',
    });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.text).toContain('event: meta');
    expect(res.text).toContain('event: token');
    expect(res.text).toContain('event: done');
  }, 10000);

  it('POST /api/chat rejects empty message with 400 validation error', async () => {
    const res = await request(app).post('/api/chat').send({ message: '   ', city: 'bhopal' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
