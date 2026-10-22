import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env.js';
import { MSG } from '../shared/constants/messages.js';

// NOTE: The default MemoryStore is per-process. This is fine for a single Render
// instance. When scaling horizontally, pass a shared store (e.g. rate-limit-redis).

function handler(req, res, _next, options) {
  const resetTime = req.rateLimit?.resetTime;
  const retryAfter = resetTime ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000)) : Math.ceil(options.windowMs / 1000);
  res.set('Retry-After', String(retryAfter));
  res.status(options.statusCode).json({
    success: false,
    message: MSG.RATE_LIMITED,
    code: 'RATE_LIMITED',
    retryAfter,
  });
}

const base = { standardHeaders: 'draft-8', legacyHeaders: false, handler };
const ipKey = (req) => ipKeyGenerator(req.ip || '');
const minutes = (n) => n * 60_000;

/** Failed logins per (email, IP). Successful logins don't count. */
export const loginAccountLimiter = rateLimit({
  ...base,
  windowMs: minutes(env.RATE_LIMIT_LOGIN_WINDOW_MIN),
  limit: env.RATE_LIMIT_LOGIN_MAX,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : '';
    return `login:${email}:${ipKey(req)}`;
  },
});

/** Coarser per-IP cap on login attempts (credential stuffing across many accounts). */
export const loginIpLimiter = rateLimit({
  ...base,
  windowMs: minutes(env.RATE_LIMIT_LOGIN_WINDOW_MIN),
  limit: env.RATE_LIMIT_LOGIN_MAX * 6,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `login-ip:${ipKey(req)}`,
});

export const registerLimiter = rateLimit({
  ...base,
  windowMs: minutes(env.RATE_LIMIT_REGISTER_WINDOW_MIN),
  limit: env.RATE_LIMIT_REGISTER_MAX,
  keyGenerator: (req) => `register:${ipKey(req)}`,
});

export const refreshLimiter = rateLimit({
  ...base,
  windowMs: minutes(env.RATE_LIMIT_REFRESH_WINDOW_MIN),
  limit: env.RATE_LIMIT_REFRESH_MAX,
  keyGenerator: (req) => `refresh:${ipKey(req)}`,
});

/** General API limit, keyed by authenticated user (mount after authenticate). */
export const apiLimiter = rateLimit({
  ...base,
  windowMs: minutes(1),
  limit: env.RATE_LIMIT_API_MAX,
  keyGenerator: (req) => (req.auth?.userId ? `api:u:${req.auth.userId}` : `api:ip:${ipKey(req)}`),
});

/** Sensitive finance writes, keyed by user. */
export const financeWriteLimiter = rateLimit({
  ...base,
  windowMs: minutes(1),
  limit: env.RATE_LIMIT_FINANCE_WRITE_MAX,
  skip: (req) => req.method === 'GET',
  keyGenerator: (req) => `fin:u:${req.auth?.userId || ipKey(req)}`,
});

/** Failed current-password checks on change-password, per user. */
export const passwordChangeLimiter = rateLimit({
  ...base,
  windowMs: minutes(env.RATE_LIMIT_LOGIN_WINDOW_MIN),
  limit: env.RATE_LIMIT_LOGIN_MAX,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `pwchange:${req.auth?.userId || ipKey(req)}`,
});
