import mongoose from 'mongoose';
import { z } from 'zod';

export const objectId = z
  .string()
  .trim()
  .refine((v) => mongoose.isValidObjectId(v) && /^[a-f\d]{24}$/i.test(v), 'ID không hợp lệ.');

/** Optional reference that may be explicitly cleared with null or "". */
export const nullableObjectId = z
  .union([objectId, z.literal(''), z.null()])
  .transform((v) => (v === '' ? null : v));

export const idParams = z.object({ id: objectId });

export const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.null())
    .transform((v) => (v === undefined ? undefined : v || ''));

export const url = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === '' || /^https?:\/\//i.test(v) || v.startsWith('/'), 'URL phải bắt đầu bằng http(s):// hoặc đường dẫn hợp lệ.');

export const optionalUrl = url.optional().or(z.null()).transform((v) => (v === undefined ? undefined : v || ''));

// z.coerce.date() alone would turn null into 1970-01-01, so only strings/numbers/Dates are coerced.
export const dateInput = z
  .union([z.string().trim().min(1), z.number(), z.date()], { error: 'Ngày không hợp lệ.' })
  .pipe(z.coerce.date({ error: 'Ngày không hợp lệ.' }));

/** Optional date that may be cleared with null or "". */
export const nullableDate = z
  .union([z.literal(''), z.null(), dateInput])
  .transform((v) => (v === '' ? null : v));

/** Comma separated enum list from a query string: "todo,review" → ['todo','review']. */
export const csvEnum = (values) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined))
    .pipe(z.array(z.enum(values)).max(values.length).optional());

export const booleanQuery = z
  .enum(['true', 'false', '1', '0'])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === 'true' || v === '1'));

export const searchQuery = z.string().trim().max(100).optional();

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Drops keys whose value is undefined so they are not $set. */
export function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
