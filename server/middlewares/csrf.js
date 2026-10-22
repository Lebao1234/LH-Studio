import { isAllowedOrigin } from '../config/cors.js';
import { forbidden } from '../shared/errors/AppError.js';

/**
 * CSRF defence for endpoints that rely on the refresh cookie (refresh, logout) or
 * that set it (login, register).
 *
 * 1. A custom header is mandatory. Browsers cannot attach custom headers to
 *    cross-origin requests without a CORS preflight, and preflights are only
 *    approved for allow-listed origins.
 * 2. When the browser reports an Origin (or Referer), it must be allow-listed.
 */
export function requireCsrfHeader(req, _res, next) {
  if (req.get('X-CSRF-Protection') !== '1') {
    return next(forbidden('Thiếu header bảo vệ CSRF.', 'CSRF_HEADER_MISSING'));
  }

  const origin = req.get('Origin');
  if (origin) {
    if (!isAllowedOrigin(origin)) return next(forbidden('Origin không được phép.', 'CSRF_ORIGIN_REJECTED'));
    return next();
  }

  const referer = req.get('Referer');
  if (referer) {
    let refOrigin;
    try {
      refOrigin = new URL(referer).origin;
    } catch {
      return next(forbidden('Referer không hợp lệ.', 'CSRF_ORIGIN_REJECTED'));
    }
    if (!isAllowedOrigin(refOrigin)) return next(forbidden('Origin không được phép.', 'CSRF_ORIGIN_REJECTED'));
  }
  return next();
}
