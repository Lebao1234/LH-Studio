import { z } from 'zod';
import { CHANNEL_STATUS, PLATFORMS } from '../../shared/constants/enums.js';
import { optionalText, optionalUrl, searchQuery } from '../../shared/utils/validators.js';

const base = {
  platform: z.enum(PLATFORMS),
  name: z.string().trim().min(1, 'Vui lòng nhập tên kênh.').max(120),
  handle: optionalText(120),
  platformChannelId: optionalText(200),
  channelUrl: optionalUrl,
  avatarUrl: optionalUrl,
  status: z.enum(CHANNEL_STATUS).optional(),
};

export const createChannelSchema = z.object(base);
export const updateChannelSchema = z.object(base).partial();

export const listChannelsQuery = z.object({
  platform: z.enum(PLATFORMS).optional(),
  status: z.enum(CHANNEL_STATUS).optional(),
  search: searchQuery,
});
