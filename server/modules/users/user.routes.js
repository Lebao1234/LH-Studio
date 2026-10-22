import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { compact, optionalText, optionalUrl } from '../../shared/utils/validators.js';
import { User, toSafeUser } from './user.model.js';

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  avatarUrl: optionalUrl,
  phone: optionalText(30),
});

const router = Router();

// Users edit only their own profile; email, status and password have dedicated flows.
router.patch('/me', validate({ body: updateProfileSchema }), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.auth.userId, { $set: compact(req.valid.body) }, { returnDocument: 'after', runValidators: true });
  sendSuccess(res, { message: 'Đã cập nhật hồ sơ.', data: toSafeUser(user) });
});

export default router;
