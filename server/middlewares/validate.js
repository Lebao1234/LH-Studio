import { AppError } from '../shared/errors/AppError.js';
import { MSG } from '../shared/constants/messages.js';

const formatIssues = (issues, location) =>
  issues.map((i) => ({ location, path: i.path.join('.'), message: i.message }));

/**
 * Validates req.params / req.query / req.body with Zod schemas.
 * Parsed (and stripped) values are exposed on req.valid — handlers must read from
 * there, never from the raw request.
 */
export function validate({ params, query, body } = {}) {
  return (req, _res, next) => {
    const errors = [];
    const valid = { params: {}, query: {}, body: {} };

    for (const [location, schema] of Object.entries({ params, query, body })) {
      if (!schema) continue;
      const result = schema.safeParse(req[location] ?? {});
      if (result.success) valid[location] = result.data;
      else errors.push(...formatIssues(result.error.issues, location));
    }

    if (errors.length) return next(new AppError(400, 'VALIDATION_ERROR', MSG.VALIDATION_FAILED, errors));
    req.valid = valid;
    return next();
  };
}
