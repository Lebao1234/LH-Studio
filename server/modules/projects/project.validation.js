import { z } from 'zod';
import { PROJECT_PRIORITY, PROJECT_ROLES, PROJECT_STATUS } from '../../shared/constants/enums.js';
import { paginationQuery } from '../../shared/utils/pagination.js';
import { csvEnum, nullableDate, objectId, optionalText, optionalUrl, searchQuery } from '../../shared/utils/validators.js';

const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9_-]{0,29}$/, 'Mã dự án chỉ gồm chữ, số, "-" hoặc "_" (tối đa 30 ký tự).');

const dateOrder = (d) => !d.startDate || !d.dueDate || d.dueDate >= d.startDate;

const base = {
  code,
  category: z.string().trim().max(20).optional(),
  title: z.string().trim().min(1, 'Vui lòng nhập tên dự án.').max(200),
  description: optionalText(5000),
  coverUrl: optionalUrl,
  status: z.enum(PROJECT_STATUS).optional(),
  priority: z.enum(PROJECT_PRIORITY).nullable().optional(),
  startDate: nullableDate.optional(),
  dueDate: nullableDate.optional(),
};

export const nextCodeQuery = z.object({
  category: z.string().trim().max(20).optional(),
});

export const createProjectSchema = z
  .object(base)
  .refine(dateOrder, { path: ['dueDate'], message: 'Hạn chót phải sau ngày bắt đầu.' });

export const updateProjectSchema = z
  .object(base)
  .partial()
  .refine(dateOrder, { path: ['dueDate'], message: 'Hạn chót phải sau ngày bắt đầu.' });

export const listProjectsQuery = z.object({
  ...paginationQuery,
  search: searchQuery,
  category: z.string().trim().max(20).optional(),
  status: csvEnum(PROJECT_STATUS),
  priority: z.enum(PROJECT_PRIORITY).optional(),
  sort: z.string().max(30).optional(),
});

export const projectMemberSchema = z.object({
  userId: objectId,
  role: z.enum(PROJECT_ROLES).default('member'),
});

export const projectMemberParams = z.object({ id: objectId, userId: objectId });
