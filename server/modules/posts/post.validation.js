import { z } from 'zod';
import { PLATFORMS, POST_STATUS } from '../../shared/constants/enums.js';
import { counterSchema } from '../../shared/utils/money.js';
import { paginationQuery } from '../../shared/utils/pagination.js';
import {
  booleanQuery,
  csvEnum,
  dateInput,
  nullableDate,
  nullableObjectId,
  objectId,
  optionalText,
  optionalUrl,
  searchQuery,
  url,
} from '../../shared/utils/validators.js';

const base = {
  channelId: objectId,
  projectId: nullableObjectId.optional(),
  episodeId: nullableObjectId.optional(),
  title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề.').max(300),
  content: optionalText(20_000),
  mediaUrls: z.array(url).max(20).optional(),
  status: z.enum(POST_STATUS).optional(),
  scheduledAt: nullableDate.optional(),
  publishedAt: nullableDate.optional(),
  externalPostId: optionalText(200),
  externalUrl: optionalUrl,
};

export const createPostSchema = z.object(base);
export const updatePostSchema = z.object(base).partial();

const listBase = {
  status: csvEnum(POST_STATUS),
  channelId: objectId.optional(),
  platform: z.enum(PLATFORMS).optional(),
  projectId: objectId.optional(),
  episodeId: objectId.optional(),
  independent: booleanQuery,
  search: searchQuery,
};

export const listPostsQuery = z.object({
  ...paginationQuery,
  ...listBase,
  from: dateInput.optional(),
  to: dateInput.optional(),
  sort: z.string().max(30).optional(),
});

export const calendarQuery = z
  .object({
    ...listBase,
    start: dateInput,
    end: dateInput,
  })
  .refine((q) => q.end > q.start, { path: ['end'], message: 'Ngày kết thúc phải sau ngày bắt đầu.' })
  .refine((q) => q.end - q.start <= 100 * 86_400_000, { path: ['end'], message: 'Khoảng thời gian tối đa 100 ngày.' });

export const createMetricSchema = z.object({
  recordedAt: dateInput.optional(),
  views: counterSchema.default(0n),
  likes: counterSchema.default(0n),
  comments: counterSchema.optional(),
  shares: counterSchema.optional(),
  watchTimeSeconds: counterSchema.optional(),
});
