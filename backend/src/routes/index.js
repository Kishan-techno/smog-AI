import { Router } from 'express';
import mongoose from 'mongoose';
import { aqiController } from '../controllers/aqiController.js';
import { authController } from '../controllers/authController.js';
import { chatController } from '../controllers/chatController.js';
import { communityController } from '../controllers/communityController.js';
import { forecastController } from '../controllers/forecastController.js';
import { routineController } from '../controllers/routineController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  aqiQuerySchema,
  chatRequestSchema,
  communityQuerySchema,
  exposureRequestSchema,
  forecastQuerySchema,
  loginSchema,
  pledgeRequestSchema,
  registerSchema,
  routineSchema,
  simulatorRequestSchema,
} from '../validators/schemas.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'smog-saathi-api',
    timestamp: new Date().toISOString(),
    dbReady: mongoose.connection.readyState === 1,
  });
});

// Auth
apiRouter.post('/auth/register', authLimiter, validateBody(registerSchema), authController.register);
apiRouter.post('/auth/login', authLimiter, validateBody(loginSchema), authController.login);
apiRouter.get('/auth/me', requireAuth, authController.me);

// AQI & Weather
apiRouter.get('/aqi/cities', aqiController.listCities);
apiRouter.get('/aqi/current', validateQuery(aqiQuerySchema), aqiController.getCurrent);

// Family Routine & Explainable Daily Action Plan
apiRouter.get('/routine', optionalAuth, routineController.getRoutine);
apiRouter.put('/routine', optionalAuth, validateBody(routineSchema), routineController.saveRoutine);
apiRouter.get('/recommendations/plan', optionalAuth, routineController.getPlan);

// GenAI RAG Chat Assistant (REST + SSE Stream)
apiRouter.post('/chat', optionalAuth, validateBody(chatRequestSchema), chatController.ask);
apiRouter.post('/chat/stream', optionalAuth, validateBody(chatRequestSchema), chatController.stream);

// Historical Trends, 24-48h ML Forecast & What-If Simulator
apiRouter.get('/forecast', validateQuery(forecastQuerySchema), forecastController.getForecast);
apiRouter.post('/simulator/run', validateBody(simulatorRequestSchema), forecastController.simulate);

// Personal Exposure Score, Aggregated Community Dashboard & Alerts
apiRouter.post(
  '/exposure/calculate',
  validateBody(exposureRequestSchema),
  communityController.calculateExposure
);
apiRouter.get(
  '/community/summary',
  validateQuery(communityQuerySchema),
  communityController.getCommunity
);
apiRouter.post(
  '/community/pledge',
  validateBody(pledgeRequestSchema),
  communityController.createPledge
);
apiRouter.get('/alerts', communityController.getAlerts);
