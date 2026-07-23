import 'dotenv/config';
import { z } from 'zod';

const urlSchema = z.string().url();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_CALLBACK_URL: urlSchema,

  // APP_URL remains a fallback for existing deployments.
  APP_URL: urlSchema.optional(),
  FRONTEND_URL: urlSchema.optional(),
  PUBLIC_API_URL: urlSchema.optional(),
}).transform((value) => ({
  ...value,
  FRONTEND_URL: value.FRONTEND_URL ?? value.APP_URL ?? 'http://localhost:3000',
  PUBLIC_API_URL:
    value.PUBLIC_API_URL ?? value.APP_URL ?? 'http://localhost:3001',
}));

export const env = envSchema.parse(process.env);
