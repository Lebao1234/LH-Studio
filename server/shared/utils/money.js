import { z } from 'zod';

/** Upper bound for a single VND amount: 10^15 ₫ is far beyond any studio need. */
export const MAX_AMOUNT = 1_000_000_000_000_000n;

/**
 * Zod schema for integer VND amounts. Accepts a decimal string ("50000000") or a
 * safe integer number and produces a BigInt. Never goes through floating point.
 */
export const amountSchema = z
  .union([z.string().trim().regex(/^\d{1,16}$/, 'Số tiền phải là số nguyên dương (VND).'), z.number().int().nonnegative()])
  .transform((v, ctx) => {
    if (typeof v === 'number' && !Number.isSafeInteger(v)) {
      ctx.addIssue({ code: 'custom', message: 'Số tiền quá lớn, hãy gửi dạng chuỗi.' });
      return z.NEVER;
    }
    return BigInt(v);
  })
  .refine((v) => v > 0n, 'Số tiền phải lớn hơn 0.')
  .refine((v) => v <= MAX_AMOUNT, 'Số tiền vượt quá giới hạn cho phép.');

/** Non-negative integer counter (metrics) as BigInt. */
export const counterSchema = z
  .union([z.string().trim().regex(/^\d{1,18}$/), z.number().int().nonnegative()])
  .transform((v) => BigInt(v));

/** Normalises aggregation output (Long → BigInt, missing → 0n). */
export function toBigInt(value) {
  if (value === null || value === undefined) return 0n;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.trunc(value));
  if (typeof value === 'object' && typeof value.toBigInt === 'function') return value.toBigInt();
  return BigInt(String(value));
}
