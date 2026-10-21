import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  MONGODB_URI: z.string().default('mongodb+srv://user-aman:G2yptoEbtKcwNEfX@notes.edr7oup.mongodb.net/restaurantpos?appName=Cluster0'),
  JWT_SECRET: z.string().min(16).default('hQA70evDVs0Rve1fa7pxY3O9JTcOgOX2bTji27SJ1xK'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(16).default('VygzCtN8eIMB94ooYXWmX8AlvyoTT3t0vuLx4Sk6Qqo'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
