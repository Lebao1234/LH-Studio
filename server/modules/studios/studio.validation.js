import { z } from 'zod';
import { MEMBER_STATUS, STUDIO_ROLES } from '../../shared/constants/enums.js';
import { objectId, optionalText, optionalUrl } from '../../shared/utils/validators.js';
import { email } from '../auth/auth.validation.js';

export const updateStudioSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: optionalText(2000),
  logoUrl: optionalUrl,
  timezone: z.string().trim().min(3).max(64).optional(),
});

export const listMembersQuery = z.object({
  status: z.enum(MEMBER_STATUS).optional(),
});

export const addMemberSchema = z.object({
  email,
  name: z.string().trim().min(2).max(100).optional(),
  role: z.enum(STUDIO_ROLES.filter((r) => r !== 'owner')).default('member'),
});

export const updateMemberSchema = z
  .object({
    role: z.enum(STUDIO_ROLES).optional(),
    status: z.enum(MEMBER_STATUS).optional(),
  })
  .refine((d) => d.role || d.status, 'Không có thay đổi.');

export const memberParams = z.object({ id: objectId });
