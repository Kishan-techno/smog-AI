import { env } from './env.js';

function formatLog(level, message, meta = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  return JSON.stringify(payload);
}

export const logger = {
  info(message, meta) {
    if (env.NODE_ENV !== 'test') {
      console.log(formatLog('info', message, meta));
    }
  },
  warn(message, meta) {
    if (env.NODE_ENV !== 'test') {
      console.warn(formatLog('warn', message, meta));
    }
  },
  error(message, meta) {
    console.error(formatLog('error', message, meta));
  },
};
