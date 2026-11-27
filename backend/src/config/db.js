import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env.js';
import { logger } from './logger.js';

let memoryServer = null;
let useInMemoryFallback = false;

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export function isInMemoryFallbackActive() {
  return useInMemoryFallback;
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    useInMemoryFallback = false;
    return mongoose.connection;
  }

  if (env.MONGODB_URI) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 2500,
      });
      useInMemoryFallback = false;
      logger.info('Connected to MongoDB', { uri: 'configured' });
      return mongoose.connection;
    } catch (err) {
      logger.warn('Configured MONGODB_URI unreachable, trying MongoMemoryServer', {
        error: err.message,
      });
    }
  }

  if (process.env.USE_MEMORY_MONGO === 'true') {
    try {
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri('smog_saathi');
      await mongoose.connect(memUri);
      useInMemoryFallback = false;
      logger.info('Connected to MongoMemoryServer');
      return mongoose.connection;
    } catch (err) {
      logger.warn('MongoMemoryServer unavailable', { error: err.message });
    }
  }

  useInMemoryFallback = true;
  logger.info('Using fast local in-memory store (set MONGODB_URI for external MongoDB)');
  return null;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
