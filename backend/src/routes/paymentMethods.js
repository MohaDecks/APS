import { Router } from 'express';
import PaymentMethod from '../models/PaymentMethod.js';
import { authMiddleware, canUpdatePayments } from '../middleware/auth.js';
import { toApi, toApiList } from '../utils/format.js';
import { paymentLogoUpload, logoUrlForFile, deleteLogoFile, runSingleUpload } from '../utils/upload.js';

const router = Router();

function optionalLogoUpload(req, res, next) {
  if (req.is('multipart/form-data')) {
    return runSingleUpload(paymentLogoUpload, 'logo')(req, res, next);
  }
  next();
}

function asBool01(v, fallback = 0) {
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return fallback;
}

function asActive(v) {
  if (v === undefined || v === null || v === '') return true;
  return v !== 'false' && v !== false && v !== 0 && v !== '0';
}

function parseImageUrl(body) {
  if (Array.isArray(body.image_url)) return body.image_url.filter(Boolean);
  if (typeof body.image_url === 'string' && body.image_url.trim()) {
    try {
      const parsed = JSON.parse(body.image_url);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return [body.image_url];
    }
  }
  return [];
}

function fieldPayload(body, existing = null) {
  const images = parseImageUrl(body);
  const logoFromImages = images[0] || null;
  const active = body.active !== undefined ? asActive(body.active) : (existing?.active ?? true);
  const status = body.status !== undefined ? asBool01(body.status, 1) : (existing?.status ?? (active ? 1 : 0));

  return {
    name: body.name !== undefined ? String(body.name || '').trim() : existing?.name,
    country: body.country !== undefined ? String(body.country || 'Ethiopia').trim() : (existing?.country || 'Ethiopia'),
    city_name: body.city_name !== undefined ? String(body.city_name || '').trim() : (existing?.city_name || ''),
    merchantUid: body.merchantUid !== undefined ? String(body.merchantUid || '').trim() : (existing?.merchantUid || ''),
    apiKey: body.apiKey !== undefined ? String(body.apiKey || '').trim() : (existing?.apiKey || ''),
    apiUserId: body.apiUserId !== undefined ? String(body.apiUserId || '').trim() : (existing?.apiUserId || ''),
    prefix: body.prefix !== undefined ? String(body.prefix || '').trim() : (existing?.prefix || ''),
    merchant_prefix: body.merchant_prefix !== undefined ? String(body.merchant_prefix || '').trim() : (existing?.merchant_prefix || ''),
    is_visible: body.is_visible !== undefined ? asBool01(body.is_visible, 1) : (existing?.is_visible ?? 1),
    is_ussd: body.is_ussd !== undefined ? asBool01(body.is_ussd, 0) : (existing?.is_ussd ?? 0),
    status,
    active: body.active !== undefined ? asActive(body.active) : status === 1,
    icon: body.icon !== undefined ? (String(body.icon || '').trim() || '💳') : (existing?.icon || '💳'),
    sort_order: body.sort_order !== undefined ? Number(body.sort_order) || 0 : (existing?.sort_order || 0),
    image_url: body.image_url !== undefined ? images : (existing?.image_url || []),
  };
}

/** Active methods for operators (checkout) */
router.get('/active', authMiddleware, async (req, res) => {
  const methods = await PaymentMethod.find({
    $or: [{ active: true }, { status: 1 }],
  }).sort({ sort_order: 1, name: 1 });
  res.json(toApiList(methods));
});

router.use(authMiddleware);

/** Full list — admin */
router.get('/', async (req, res) => {
  const methods = await PaymentMethod.find().sort({ sort_order: 1, name: 1 });
  res.json(toApiList(methods));
});

router.post('/', canUpdatePayments, runSingleUpload(paymentLogoUpload, 'logo'), async (req, res) => {
  try {
    const payload = fieldPayload(req.body);
    if (!payload.name) {
      if (req.file) deleteLogoFile(logoUrlForFile(req.file.filename));
      return res.status(400).json({ error: 'Payment method name is required' });
    }

    if (req.file) {
      payload.logo_url = logoUrlForFile(req.file.filename);
      if (!payload.image_url?.length) payload.image_url = [payload.logo_url];
    }

    const method = await PaymentMethod.create(payload);
    res.status(201).json(toApi(method));
  } catch (err) {
    if (req.file) deleteLogoFile(logoUrlForFile(req.file.filename));
    res.status(400).json({ error: err.message || 'Upload failed' });
  }
});

router.put('/:id', canUpdatePayments, optionalLogoUpload, async (req, res) => {
  try {
    const method = await PaymentMethod.findById(req.params.id);
    if (!method) {
      if (req.file) deleteLogoFile(logoUrlForFile(req.file.filename));
      return res.status(404).json({ error: 'Payment method not found' });
    }

    const payload = fieldPayload(req.body, method);
    if (!payload.name) {
      if (req.file) deleteLogoFile(logoUrlForFile(req.file.filename));
      return res.status(400).json({ error: 'Payment method name is required' });
    }

    Object.assign(method, payload);

    if (req.file) {
      deleteLogoFile(method.logo_url);
      method.logo_url = logoUrlForFile(req.file.filename);
      const imgs = Array.isArray(method.image_url) ? [...method.image_url] : [];
      if (!imgs.includes(method.logo_url)) imgs.unshift(method.logo_url);
      method.image_url = imgs;
    }

    await method.save();
    res.json(toApi(method));
  } catch (err) {
    if (req.file) deleteLogoFile(logoUrlForFile(req.file.filename));
    res.status(400).json({ error: err.message || 'Update failed' });
  }
});

router.delete('/:id', canUpdatePayments, async (req, res) => {
  const result = await PaymentMethod.findByIdAndDelete(req.params.id);
  if (!result) return res.status(404).json({ error: 'Payment method not found' });
  deleteLogoFile(result.logo_url);
  res.json({ ok: true });
});

export default router;
