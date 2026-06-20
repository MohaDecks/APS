import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_ROOT = path.join(__dirname, '../../uploads');
export const PAYMENT_LOGO_DIR = path.join(UPLOAD_ROOT, 'payment-methods');
export const FACILITY_LOGO_DIR = path.join(UPLOAD_ROOT, 'facility');

fs.mkdirSync(PAYMENT_LOGO_DIR, { recursive: true });
fs.mkdirSync(FACILITY_LOGO_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/octet-stream',
]);

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);

export function logoUrlForFile(filename) {
  return `/api/uploads/payment-methods/${filename}`;
}

export function facilityLogoUrlForFile(filename) {
  return `/api/uploads/facility/${filename}`;
}

function deleteUploadedFile(logoUrl, prefix, dir) {
  if (!logoUrl?.startsWith(prefix)) return;
  const filename = path.basename(logoUrl);
  const filePath = path.join(dir, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export function deleteLogoFile(logoUrl) {
  deleteUploadedFile(logoUrl, '/api/uploads/payment-methods/', PAYMENT_LOGO_DIR);
}

export function deleteFacilityLogoFile(logoUrl) {
  deleteUploadedFile(logoUrl, '/api/uploads/facility/', FACILITY_LOGO_DIR);
}

function imageUploadStorage(dir) {
  return multer.diskStorage({
    destination: dir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  });
}

function isAllowedImage(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME.has(file.mimetype)) return ALLOWED_EXT.has(ext) || file.mimetype !== 'application/octet-stream';
  if (ALLOWED_EXT.has(ext)) return true;
  return false;
}

function imageFileFilter(_req, file, cb) {
  if (isAllowedImage(file)) cb(null, true);
  else cb(new Error('Only image files are allowed (PNG, JPG, WEBP, GIF, SVG)'));
}

export function handleUploadError(res, err) {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Image must be 5 MB or smaller' });
  }
  return res.status(400).json({ error: err?.message || 'Upload failed' });
}

export function runSingleUpload(upload, field) {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      if (err) return handleUploadError(res, err);
      next();
    });
  };
}

export const paymentLogoUpload = multer({
  storage: imageUploadStorage(PAYMENT_LOGO_DIR),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

export const facilityLogoUpload = multer({
  storage: imageUploadStorage(FACILITY_LOGO_DIR),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});
