import { z } from 'zod';

export const paginationQuery = {
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export function toSkip({ page, limit }) {
  return (page - 1) * limit;
}

export function paginationMeta({ page, limit }, total) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/**
 * Builds a Mongo sort object from "field" / "-field" restricted to an allowlist.
 * Always adds _id as tiebreaker for stable pagination.
 */
export function buildSort(sortParam, allowed, fallback = '-createdAt') {
  const value = sortParam && allowed.includes(sortParam.replace(/^-/, '')) ? sortParam : fallback;
  const desc = value.startsWith('-');
  const field = value.replace(/^-/, '');
  return { [field]: desc ? -1 : 1, _id: desc ? -1 : 1 };
}
