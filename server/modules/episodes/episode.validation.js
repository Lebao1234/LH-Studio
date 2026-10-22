import { z } from 'zod';
import { EPISODE_STATUS } from '../../shared/constants/enums.js';
import { paginationQuery } from '../../shared/utils/pagination.js';
import { csvEnum, nullableDate, nullableObjectId, objectId, optionalText, optionalUrl, searchQuery } from '../../shared/utils/validators.js';

const dateOrder = (d) => !d.startDate || !d.dueDate || d.dueDate >= d.startDate;

const base = {
  episodeNumber: z.coerce.number().int().min(0).max(100_000),
  title: z.string().trim().min(1, 'Vui lòng nhập tên tập.').max(200),
  description: optionalText(5000),
  script: optionalText(100_000),
  coverUrl: optionalUrl,
  videoUrl: optionalUrl,
  status: z.enum(EPISODE_STATUS).optional(),
  assignedTo: nullableObjectId.optional(),
  startDate: nullableDate.optional(),
  dueDate: nullableDate.optional(),
};

export const createEpisodeSchema = z
  .object({ ...base, episodeNumber: base.episodeNumber.optional() })
  .refine(dateOrder, { path: ['dueDate'], message: 'Hạn chót phải sau ngày bắt đầu.' });

export const updateEpisodeSchema = z
  .object(base)
  .partial()
  .refine(dateOrder, { path: ['dueDate'], message: 'Hạn chót phải sau ngày bắt đầu.' });

export const listEpisodesQuery = z.object({
  ...paginationQuery,
  limit: z.coerce.number().int().min(1).max(200).default(100),
  status: csvEnum(EPISODE_STATUS),
  search: searchQuery,
  sort: z.string().max(30).optional(),
});

export const projectParams = z.object({ projectId: objectId });
