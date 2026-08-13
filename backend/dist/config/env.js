"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const urlSchema = zod_1.z.string().url();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(3000),
    DATABASE_URL: zod_1.z.string().url(),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    GITHUB_CLIENT_ID: zod_1.z.string(),
    GITHUB_CLIENT_SECRET: zod_1.z.string(),
    GITHUB_CALLBACK_URL: urlSchema,
    GEMINI_API_KEY: zod_1.z.string().min(1),
    AI_PROVIDER: zod_1.z
        .enum(["gemini"])
        .default("gemini"),
    GEMINI_MODEL: zod_1.z.string().default("gemini-2.5-flash"),
    GEMINI_TIMEOUT_MS: zod_1.z.coerce.number().int().min(1_000).max(120_000).default(30_000),
    WEBHOOK_SECRET: zod_1.z.string().min(10),
    APP_URL: urlSchema.optional(),
    FRONTEND_URL: urlSchema.optional(),
    PUBLIC_API_URL: urlSchema.optional(),
}).transform((value) => ({
    ...value,
    FRONTEND_URL: value.FRONTEND_URL ??
        value.APP_URL ??
        "http://localhost:3000",
    PUBLIC_API_URL: value.PUBLIC_API_URL ??
        value.APP_URL ??
        "http://localhost:3001",
}));
exports.env = envSchema.parse(process.env);
