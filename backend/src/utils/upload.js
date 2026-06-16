import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_ROOT = path.join(__dirname, '../../uploads');
export const PAYMENT_LOGO_DIR = path.join(UPLOAD_ROOT, 'payment-methods');

fs.mkdirSync(PAYMENT_LOGO_DIR, { recursive: true });

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);

export const paymentLogoUpload = multer({
  storage: multer.diskStorage({
    destination: PAYMENT_LOGO_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

export function logoUrlForFile(filename) {
  return `/api/uploads/payment-methods/${filename}`;
}

export function deleteLogoFile(logoUrl) {
  if (!logoUrl?.startsWith('/api/uploads/payment-methods/')) return;
  const filename = path.basename(logoUrl);
  const filePath = path.join(PAYMENT_LOGO_DIR, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}
