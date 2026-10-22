import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env.js';
import { slugify } from '../../shared/utils/slug.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

export function isCloudinaryConfigured() {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  );
}

export function isR2Configured() {
  return Boolean(
    env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET_NAME
  );
}

// Initialize Cloudinary if configured
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

let s3ClientInstance = null;
function getS3Client() {
  if (!s3ClientInstance && isR2Configured()) {
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3ClientInstance;
}

/** Sanitize file name and create a structured storage key */
function generateKey(folder, originalFilename) {
  const ext = path.extname(originalFilename || '').toLowerCase();
  const baseName = path.basename(originalFilename || 'file', ext);
  const cleanBase = slugify(baseName) || 'file';
  const uniqueId = crypto.randomBytes(6).toString('hex');
  const dateTag = new Date().toISOString().slice(0, 7); // e.g. "2026-10"
  const cleanFolder = (folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
  return `${cleanFolder}/${dateTag}/${uniqueId}-${cleanBase}${ext}`;
}

/**
 * Returns storage configuration status (useful for UI diagnostics)
 */
export function getStorageStatus() {
  if (isCloudinaryConfigured()) {
    return {
      provider: 'cloudinary',
      isCloudinary: true,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      maxFileSize: '100MB video / 20MB image',
    };
  }
  if (isR2Configured()) {
    return {
      provider: 'cloudflare_r2',
      isCloudflareR2: true,
      bucket: env.R2_BUCKET_NAME,
      publicUrlConfigured: Boolean(env.R2_PUBLIC_URL),
      maxFileSize: '5GB',
    };
  }
  return {
    provider: 'local_storage',
    isLocal: true,
    maxFileSize: '1GB',
  };
}

/**
 * Upload a file directly to Cloudinary from server (e.g. from multer)
 */
export async function uploadToCloudinary(filePath, folder = 'general') {
  const folderPath = `lh-studio/${folder.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const result = await cloudinary.uploader.upload(filePath, {
    folder: folderPath,
    resource_type: 'auto',
  });
  return {
    fileUrl: result.secure_url,
    publicId: result.public_id,
    duration: result.duration,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Generates an upload configuration:
 * 1. Cloudinary: Generates signed parameters for direct-to-Cloudinary upload.
 * 2. Cloudflare R2: Generates a Presigned PUT URL directly to R2.
 * 3. Local storage: Generates a local upload URL to our Express API.
 */
export async function getUploadUrl({ filename, contentType, folder = 'general', studioId }) {
  const key = generateKey(folder, filename);

  // 1. Cloudinary (Active)
  if (isCloudinaryConfigured()) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folderPath = `lh-studio/${folder.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const paramsToSign = {
      folder: folderPath,
      timestamp,
    };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);

    return {
      provider: 'cloudinary',
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      method: 'POST',
      key,
      fields: {
        api_key: env.CLOUDINARY_API_KEY,
        timestamp,
        signature,
        folder: folderPath,
      },
    };
  }

  // 2. Cloudflare R2 (If configured)
  if (isR2Configured()) {
    const s3 = getS3Client();
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
    const publicBase = env.R2_PUBLIC_URL
      ? env.R2_PUBLIC_URL.replace(/\/$/, '')
      : `https://${env.R2_BUCKET_NAME}.${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

    return {
      provider: 'cloudflare_r2',
      uploadUrl,
      fileUrl: `${publicBase}/${key}`,
      key,
      method: 'PUT',
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
      },
    };
  }

  // 3. Local storage fallback
  return {
    provider: 'local_storage',
    uploadUrl: `/api/v1/storage/upload?folder=${encodeURIComponent(folder)}&key=${encodeURIComponent(key)}`,
    fileUrl: `/uploads/${key}`,
    key,
    method: 'POST',
    headers: {},
  };
}
