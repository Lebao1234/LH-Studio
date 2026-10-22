import { forbidden } from '../shared/errors/AppError.js';

/** Restricts a route to the given studio roles (requires studioContext). */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.ctx || !roles.includes(req.ctx.role)) return next(forbidden());
    return next();
  };
}

/** Blocks read-only viewers from write routes. */
export const requireWriter = authorize('owner', 'admin', 'member');
export const requireStudioManager = authorize('owner', 'admin');
