import { env } from './env.js';

export const ALLOWED_HEADERS = [
  'Authorization',
  'Content-Type',
  'X-CSRF-Protection',
  'X-Studio-Id',
  'Idempotency-Key',
];

export function isAllowedOrigin(origin) {
  return Boolean(origin) && env.clientOrigins.includes(origin.replace(/\/$/, ''));
}

export const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header (curl, server-to-server, same-origin) are allowed;
    // cookie-authenticated endpoints have their own CSRF checks.
    if (!origin || isAllowedOrigin(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ALLOWED_HEADERS,
  exposedHeaders: ['Content-Disposition', 'Retry-After', 'RateLimit', 'RateLimit-Policy'],
  maxAge: 600,
};
