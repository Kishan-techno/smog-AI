import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1000).max(65535).default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().optional().default(''),
  JWT_SECRET: z.string().min(12).default('smog-saathi-local-dev-secret-key-2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  AQI_CACHE_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(600),
  WEATHER_CACHE_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  WAQI_TOKEN: z.string().optional().default(''),
  OPENAQ_API_KEY: z.string().optional().default(''),
  ML_SERVICE_URL: z.string().default('http://127.0.0.1:8000'),
  GEMINI_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  LLM_MODEL: z.string().default('gemini-2.0-flash'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
