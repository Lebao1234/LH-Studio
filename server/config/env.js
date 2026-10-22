import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });
dotenv.config({ quiet: true });

const bool = (fallback) =>
  z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((v) => (v === undefined ? fallback : v === 'true' || v === '1'));

const int = (fallback) => z.coerce.number().int().positive().default(fallback);

const isProd = process.env.NODE_ENV === 'production';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(5055),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_ISSUER: z.string().default('lh-studio-api'),
  JWT_AUDIENCE: z.string().default('lh-studio-client'),

  // Comma-separated list of allowed browser origins.
  CLIENT_URL: z.string().default('http://localhost:5173,https://lh-studio-chi.vercel.app'),

  COOKIE_SECURE: bool(isProd),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default(isProd ? 'none' : 'lax'),
  COOKIE_DOMAIN: z.string().optional(),

  // Number of reverse-proxy hops to trust (Render = 1). 0 disables.
  TRUST_PROXY: z.coerce.number().int().min(0).default(isProd ? 1 : 0),

  // Initial owner bootstrap. Registration without an invitation only works while
  // no studio exists AND the request carries this token.
  BOOTSTRAP_TOKEN: z.string().min(16).optional(),
  INVITE_EXPIRES_DAYS: int(7),

  RATE_LIMIT_LOGIN_MAX: int(5),
  RATE_LIMIT_LOGIN_WINDOW_MIN: int(15),
  RATE_LIMIT_REGISTER_MAX: int(3),
  RATE_LIMIT_REGISTER_WINDOW_MIN: int(60),
  RATE_LIMIT_REFRESH_MAX: int(30),
  RATE_LIMIT_REFRESH_WINDOW_MIN: int(15),
  // A single dashboard load issues ~8 requests; 100/min was hit by normal fast navigation.
  RATE_LIMIT_API_MAX: int(300),
  RATE_LIMIT_FINANCE_WRITE_MAX: int(20),

  // Cloudflare R2 Object Storage (S3-compatible)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  // Cloudinary Storage (25GB Free - No credit card required)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Episode scripts can be long; everything else is far below this.
  BODY_LIMIT: z.string().default('512kb'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

const raw = parsed.data;

if (raw.COOKIE_SAMESITE === 'none' && !raw.COOKIE_SECURE) {
  throw new Error('COOKIE_SAMESITE=none requires COOKIE_SECURE=true');
}

/** Parses durations such as "15m", "7d", "3600s" into milliseconds. */
export function durationToMs(value) {
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(String(value).trim());
  if (!match) throw new Error(`Invalid duration: ${value}`);
  const n = Number(match[1]);
  const unit = match[2] || 's';
  const factor = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return n * factor;
}

export const env = Object.freeze({
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  clientOrigins: raw.CLIENT_URL.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean),
  accessTtlMs: durationToMs(raw.JWT_ACCESS_EXPIRES_IN),
  refreshTtlMs: durationToMs(raw.JWT_REFRESH_EXPIRES_IN),
});
