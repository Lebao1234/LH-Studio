import { z } from 'zod';
import { ASSIGNMENT_ROLES, TASK_PRIORITY, TASK_STATUS, TASK_TYPES } from '../../shared/constants/enums.js';
import { paginationQuery } from '../../shared/utils/pagination.js';
import {
  booleanQuery,
  csvEnum,
  dateInput,
  nullableDate,
  nullableObjectId,
  objectId,
  optionalText,
  searchQuery,
} from '../../shared/utils/validators.js';

const dateOrder = (d) => !d.startDate || !d.dueDate || d.dueDate >= d.startDate;

const assignee = z.object({ userId: objectId, role: z.enum(ASSIGNMENT_ROLES).default('contributor') });

const assigneeList = z
  .array(assignee)
  .max(20)
  .refine((list) => new Set(list.map((a) => a.userId)).size === list.length, 'Một người chỉ được giao một lần.')
  .refine((list) => list.filter((a) => a.role === 'lead').length <= 1, 'Mỗi công việc chỉ có tối đa một người phụ trách chính.');

const base = {
  episodeId: nullableObjectId.optional(),
  title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề.').max(200),
  description: optionalText(10_000),
  type: z.enum(TASK_TYPES).nullable().optional(),
  status: z.enum(TASK_STATUS).optional(),
  priority: z.enum(TASK_PRIORITY).optional(),
  startDate: nullableDate.optional(),
  dueDate: nullableDate.optional(),
};

export const createTaskSchema = z
  .object({ ...base, projectId: objectId, assignees: assigneeList.optional() })
  .refine(dateOrder, { path: ['dueDate'], message: 'Hạn chót phải sau ngày bắt đầu.' });

export const updateTaskSchema = z
  .object(base)
  .partial()
  .refine(dateOrder, { path: ['dueDate'], message: 'Hạn chót phải sau ngày bắt đầu.' });

export const listTasksQuery = z.object({
  ...paginationQuery,
  projectId: objectId.optional(),
  episodeId: objectId.optional(),
  status: csvEnum(TASK_STATUS),
  priority: csvEnum(TASK_PRIORITY),
  type: z.enum(TASK_TYPES).optional(),
  assignee: z.union([z.literal('me'), objectId]).optional(),
  mine: booleanQuery,
  overdue: booleanQuery,
  dueFrom: dateInput.optional(),
  dueTo: dateInput.optional(),
  search: searchQuery,
  sort: z.string().max(30).optional(),
});

export const assignmentSchema = assignee;
export const updateAssignmentSchema = z.object({ role: z.enum(ASSIGNMENT_ROLES) });
export const assignmentParams = z.object({ id: objectId, userId: objectId });
