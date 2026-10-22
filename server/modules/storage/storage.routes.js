import os from 'node:os';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as ctrl from './storage.controller.js';

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB limit for local uploads
});

const presignedUrlSchema = z.object({
  filename: z.string().trim().min(1, 'Tên file không được để trống.'),
  contentType: z.string().trim().optional(),
  folder: z.enum(['covers', 'videos', 'avatars', 'general']).default('general'),
});

const router = Router();

router.get('/status', ctrl.status);
router.post('/presigned-url', validate({ body: presignedUrlSchema }), ctrl.getPresignedUrl);
router.post('/upload', upload.single('file'), ctrl.uploadLocal);

export default router;

