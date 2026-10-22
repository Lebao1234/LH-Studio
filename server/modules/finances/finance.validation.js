import { z } from 'zod';
import { FINANCE_TYPES, PAYMENT_METHODS, TRANSACTION_MANUAL_STATUS, TRANSACTION_STATUS } from '../../shared/constants/enums.js';
import { amountSchema } from '../../shared/utils/money.js';
import { paginationQuery } from '../../shared/utils/pagination.js';
import { booleanQuery, csvEnum, dateInput, nullableDate, nullableObjectId, objectId, optionalText, searchQuery } from '../../shared/utils/validators.js';

const categoryCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9_-]{0,39}$/, 'Mã danh mục chỉ gồm chữ, số, "-" hoặc "_".');

export const listCategoriesQuery = z.object({
  type: z.enum(FINANCE_TYPES).optional(),
  active: booleanQuery,
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: categoryCode,
  type: z.enum(FINANCE_TYPES),
  description: optionalText(1000),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    code: categoryCode,
    description: optionalText(1000),
    isActive: z.boolean(),
  })
  .partial();

const range = {
  from: dateInput.optional(),
  to: dateInput.optional(),
};
const rangeOrder = (q) => !q.from || !q.to || q.to >= q.from;

export const listTransactionsQuery = z
  .object({
    ...paginationQuery,
    ...range,
    type: z.enum(FINANCE_TYPES).optional(),
    categoryId: objectId.optional(),
    projectId: objectId.optional(),
    status: csvEnum(TRANSACTION_STATUS),
    outstanding: booleanQuery,
    search: searchQuery,
    sort: z.string().max(30).optional(),
  })
  .refine(rangeOrder, { path: ['to'], message: 'Khoảng ngày không hợp lệ.' });

export const exportTransactionsQuery = listTransactionsQuery;

export const createTransactionSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập nội dung.').max(200),
  description: optionalText(5000),
  type: z.enum(FINANCE_TYPES),
  categoryId: objectId,
  projectId: nullableObjectId.optional(),
  totalAmount: amountSchema,
  status: z.enum(['planned', 'pending']).default('pending'),
  expectedDate: nullableDate.optional(),
});

// type, paidAmount, paymentCount and derived statuses are deliberately absent.
export const updateTransactionSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: optionalText(5000),
    categoryId: objectId,
    projectId: nullableObjectId,
    totalAmount: amountSchema,
    status: z.enum(TRANSACTION_MANUAL_STATUS),
    expectedDate: nullableDate,
  })
  .partial();

const idempotencyKey = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{8,100}$/, 'Idempotency key không hợp lệ.');

export const createPaymentSchema = z.object({
  amount: amountSchema,
  paidAt: dateInput,
  method: z.enum(PAYMENT_METHODS).default('bank_transfer'),
  referenceNumber: optionalText(100),
  note: optionalText(1000),
  idempotencyKey: idempotencyKey.optional(),
});

export const reversePaymentSchema = z.object({
  reason: z.string().trim().min(3, 'Vui lòng nhập lý do điều chỉnh.').max(500),
});

export const paymentParams = z.object({ id: objectId, paymentId: objectId });

export const summaryQuery = z
  .object({
    ...range,
    type: z.enum(FINANCE_TYPES).optional(),
    categoryId: objectId.optional(),
    projectId: objectId.optional(),
    status: csvEnum(TRANSACTION_STATUS),
  })
  .refine(rangeOrder, { path: ['to'], message: 'Khoảng ngày không hợp lệ.' });
