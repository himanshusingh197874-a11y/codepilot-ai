import "dotenv/config";
import { z } from "zod";

const urlSchema = z.string().url();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_CALLBACK_URL: urlSchema,

  GEMINI_API_KEY: z.string().min(1),

  AI_PROVIDER: z
    .enum(["gemini"])
    .default("gemini"),

  GEMINI_MODEL: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      "GEMINI_MODEL must be a model ID without a models/ prefix",
    )
    .default("gemini-3.5-flash"),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(30_000),

  WEBHOOK_SECRET: z.string().min(10),

  APP_URL: urlSchema.optional(),
  FRONTEND_URL: urlSchema.optional(),
  PUBLIC_API_URL: urlSchema.optional(),
}).transform((value) => ({
  ...value,
  FRONTEND_URL:
    value.FRONTEND_URL ??
    value.APP_URL ??
    "http://localhost:3000",

  PUBLIC_API_URL:
    value.PUBLIC_API_URL ??
    value.APP_URL ??
    "http://localhost:3001",
}));

export const env = envSchema.parse(process.env);
