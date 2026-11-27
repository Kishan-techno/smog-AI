import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

export function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      req.user = payload;
    } catch {
      // Invalid optional token falls back to anonymous/session context
    }
  }
  next();
}

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
  }
  const token = header.slice(7).trim();
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    return next();
  } catch {
    return next(new AppError(401, 'INVALID_TOKEN', 'Session expired or invalid token'));
  }
}

export function resolveOwnerKey(req) {
  if (req.user?.sub) return `user:${req.user.sub}`;
  const rawSession = req.headers['x-session-id'];
  if (typeof rawSession === 'string' && /^[a-zA-Z0-9_-]{8,64}$/.test(rawSession)) {
    return `session:${rawSession}`;
  }
  return 'session:demo-bhopal-family';
}
