import path from 'node:path';
import fs from 'node:fs';
import { sendSuccess } from '../../shared/utils/response.js';
import * as service from './storage.service.js';

export async function status(req, res) {
  sendSuccess(res, { data: service.getStorageStatus() });
}

export async function getPresignedUrl(req, res, next) {
  try {
    const { filename, contentType, folder } = req.body;
    const result = await service.getUploadUrl({
      filename,
      contentType,
      folder,
      studioId: req.ctx?.studioId,
    });
    sendSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
}

export async function uploadLocal(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file nào được tải lên.' });
    }

    // 1. If Cloudinary is active, upload directly to Cloudinary
    if (service.isCloudinaryConfigured()) {
      const folder = (req.query.folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
      const cloudResult = await service.uploadToCloudinary(req.file.path, folder);
      try {
        fs.unlinkSync(req.file.path);
      } catch {}

      return sendSuccess(res, {
        message: 'Tải file lên Cloudinary thành công.',
        data: {
          fileUrl: cloudResult.fileUrl,
          key: cloudResult.publicId,
          duration: cloudResult.duration,
          bytes: cloudResult.bytes,
          provider: 'cloudinary',
        },
      });
    }

    // 2. Otherwise save locally
    const requestedKey = req.query.key;
    let targetRelativePath;

    if (requestedKey) {
      targetRelativePath = requestedKey.replace(/\.\./g, '');
    } else {
      const folder = (req.query.folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
      const ext = path.extname(req.file.originalname);
      targetRelativePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    }

    const fullTargetPath = path.join(service.LOCAL_UPLOADS_DIR, targetRelativePath);
    fs.mkdirSync(path.dirname(fullTargetPath), { recursive: true });
    fs.renameSync(req.file.path, fullTargetPath);

    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${targetRelativePath}`;

    sendSuccess(res, {
      message: 'Tải file thành công.',
      data: {
        fileUrl,
        key: targetRelativePath,
        size: req.file.size,
        mimetype: req.file.mimetype,
        provider: 'local_storage',
      },
    });
  } catch (err) {
    next(err);
  }
}
