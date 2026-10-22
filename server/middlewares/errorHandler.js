import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { AppError } from '../shared/errors/AppError.js';
import { MSG } from '../shared/constants/messages.js';

function normalize(err) {
  if (err instanceof AppError) return err;

  if (err instanceof mongoose.Error.CastError) {
    return new AppError(400, 'INVALID_ID', 'Giá trị không hợp lệ.', [{ path: err.path, message: 'Invalid value' }]);
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return new AppError(422, 'VALIDATION_ERROR', MSG.VALIDATION_FAILED, errors);
  }
  if (err?.code === 11000) {
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    return new AppError(409, 'DUPLICATE_KEY', 'Dữ liệu đã tồn tại.', fields.map((f) => ({ path: f, message: 'Duplicate' })));
  }
  if (err?.type === 'entity.too.large') return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Dữ liệu gửi lên quá lớn.');
  if (err?.type === 'entity.parse.failed') return new AppError(400, 'INVALID_JSON', 'JSON không hợp lệ.');

  return null;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const appError = normalize(err);

  if (!appError) {
    // Log the error itself, never the request body (may contain credentials).
    console.error(`[error] ${req.method} ${req.originalUrl}`, env.isProd ? err?.message : err);
    return res.status(500).json({
      success: false,
      message: MSG.SYSTEM_ERROR,
      code: 'INTERNAL_ERROR',
      ...(env.isProd ? {} : { debug: String(err?.stack || err) }),
    });
  }

  const body = { success: false, message: appError.message, code: appError.code };
  if (appError.errors) body.errors = appError.errors;
  return res.status(appError.status).json(body);
}

export function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Không tìm thấy endpoint.', code: 'ROUTE_NOT_FOUND' });
}
