import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

function buildAllowedOrigins() {
  const configured = env.FRONTEND_URL.split(',')
    .map((u) => u.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return new Set([...configured, 'http://localhost:5173', 'http://127.0.0.1:5173']);
}

export function createApp() {
  const app = express();
  const allowedOrigins = buildAllowedOrigins();

  // Required behind Render / reverse proxies so express-rate-limit uses real client IP
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/+$/, '');
        if (allowedOrigins.has(normalized)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '512kb' }));

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info('http_request', {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - start,
      });
    });
    next();
  });

  app.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'smog-saathi-api',
      healthEndpoint: '/api/health',
    });
  });

  app.use('/api', apiLimiter, apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
