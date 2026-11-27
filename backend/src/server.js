import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { logger } from './config/logger.js';
import { createApp } from './app.js';

let server;

async function start() {
  await connectDatabase();
  const app = createApp();
  server = app.listen(env.PORT, () => {
    logger.info(`Smog Saathi API listening on http://localhost:${env.PORT}`);
  });
}

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', { error: err?.message || String(err) });
});

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
