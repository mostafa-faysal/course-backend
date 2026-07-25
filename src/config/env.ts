import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),
  DIRECT_URL: z.string().optional(),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_KEY: z.string().optional().default(''),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid or missing environment variables detected at startup:');
  console.error(JSON.stringify(parseResult.error.format(), null, 2));
  if (typeof logger !== 'undefined' && logger.error) {
    logger.error('Invalid environment variables detected at startup', { errors: parseResult.error.format() });
  }
  process.exit(1);
}

const env = parseResult.data;

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  corsOrigin: env.CORS_ORIGIN,
  supabase: {
    url: env.SUPABASE_URL,
    key: env.SUPABASE_KEY,
  },
  database: {
    url: env.DATABASE_URL,
  }
};

