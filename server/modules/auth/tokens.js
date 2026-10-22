import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

const ALGORITHM = 'HS256';

export const REFRESH_COOKIE = 'lh_refresh';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

export function signAccessToken({ userId, sessionId }) {
  return jwt.sign({ sid: sessionId, typ: 'access' }, env.JWT_ACCESS_SECRET, {
    algorithm: ALGORITHM,
    subject: String(userId),
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: Math.floor(env.accessTtlMs / 1000),
  });
}

export function signRefreshToken({ userId, sessionId }) {
  return jwt.sign({ sid: sessionId, typ: 'refresh', jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    algorithm: ALGORITHM,
    subject: String(userId),
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: Math.floor(env.refreshTtlMs / 1000),
  });
}

function verify(token, secret, typ, options = {}) {
  const payload = jwt.verify(token, secret, {
    algorithms: [ALGORITHM],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    ...options,
  });
  if (payload.typ !== typ || !payload.sub || !payload.sid) throw new jwt.JsonWebTokenError('invalid token type');
  return payload;
}

export const verifyAccessToken = (token) => verify(token, env.JWT_ACCESS_SECRET, 'access');
export const verifyRefreshToken = (token, options) => verify(token, env.JWT_REFRESH_SECRET, 'refresh', options);

/** SHA-256 is appropriate here: tokens are high-entropy, not user-chosen passwords. */
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');

export function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: REFRESH_COOKIE_PATH,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}
