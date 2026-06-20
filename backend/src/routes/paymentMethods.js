import { Router } from 'express';
import PaymentMethod from '../models/PaymentMethod.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { toApi, toApiList } from '../utils/format.js';
import { paymentLogoUpload, logoUrlForFile, deleteLogoFile, runSingleUpload } from '../utils/upload.js';

const router = Router();

function optionalLogoUpload(req, res, next) {
  if (req.is('multipart/form-data')) {
    return runSingleUpload(paymentLogoUpload, 'logo')(req, res, next);
  }
  next();
}

router.get('/active', authMiddleware, async (req, res) => {
  const methods = await PaymentMethod.find({ active: true }).sort({ sort_order: 1, name: 1 });
  res.json(toApiList(methods));
});

router.use(authMiddleware, adminOnly);

router.get('/', async (req, res) => {
  const methods = await PaymentMethod.find().sort({ sort_order: 1, name: 1 });
  res.json(toApiList(methods));
});

router.post('/', runSingleUpload(paymentLogoUpload, 'logo'), async (req, res) => {
  try {
    const { name, icon, active, sort_order } = req.body;
    if (!name?.trim()) {
      if (req.file) deleteLogoFile(logoUrlForFile(req.file.filename));
      return res.status(400).json({ error: 'Name required' });
    }

    const method = await PaymentMethod.create({
      name: name.trim(),
      icon: icon?.trim() || '💳',
      logo_url: req.file ? logoUrlForFile(req.file.filename) : null,
      active: active !== 'false' && active !== false,
      sort_order: Number(sort_order) || 0,
    });
    res.status(201).json(toApi(method));
  } catch (err) {
    if (req.file) deleteLogoFile(logoUrlForFile(req.file.filename));
    res.status(400).json({ error: err.message || 'Upload failed' });
  }
});

router.put('/:id', optionalLogoUpload, async (req, res) => {
  try {
    const { name, icon, active, sort_order } = req.body;
    const method = await PaymentMethod.findById(req.params.id);
    if (!method) {
      if (req.file) deleteLogoFile(logoUrlForFile(req.file.filename));
      return res.status(404).json({ error: 'Payment method not found' });
    }

    if (name !== undefined) method.name = name.trim();
    if (icon !== undefined) method.icon = icon.trim() || '💳';
    if (active !== undefined) method.active = active !== 'false' && active !== false;
    if (sort_order !== undefined) method.sort_order = Number(sort_order) || 0;

    if (req.file) {
      deleteLogoFile(method.logo_url);
      method.logo_url = logoUrlForFile(req.file.filename);
    }

    await method.save();
    res.json(toApi(method));
  } catch (err) {
    if (req.file) deleteLogoFile(logoUrlForFile(req.file.filename));
    res.status(400).json({ error: err.message || 'Update failed' });
  }
});

router.delete('/:id', async (req, res) => {
  const result = await PaymentMethod.findByIdAndDelete(req.params.id);
  if (!result) return res.status(404).json({ error: 'Payment method not found' });
  deleteLogoFile(result.logo_url);
  res.json({ ok: true });
});

export default router;
