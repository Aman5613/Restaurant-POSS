import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  MONGODB_URI: z.string().default('mongodb://pos_admin:pos_password@localhost:27017/restaurant_pos?authSource=admin'),
  JWT_SECRET: z.string().min(16).default('pos_super_secret_jwt_key_2026_dev_min16'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(16).default('pos_super_secret_cookie_key_2026_dev_min16'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  VAPID_PUBLIC_KEY: z.string().default('BNpr5r-8-xC6XaUSnCGyn7C6G-dx61CbwFhZRJNoMckZmTq-9itL41ZZjw4aojh9E0C1dRWKrSguvl4c9jzCI5Q'),
  VAPID_PRIVATE_KEY: z.string().default('Bcwrg64itsmrNlYgIvENUWaSXAwom9p0RWhlIYTEKvU'),
  VAPID_SUBJECT: z.string().default('mailto:support@pos.internal'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
