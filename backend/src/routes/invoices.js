import { Router } from 'express';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { toApi, toApiList } from '../utils/format.js';

const router = Router();
router.use(authMiddleware);

async function enrichInvoices(invoices) {
  const userIds = [...new Set(invoices.map((i) => String(i.issued_by)).filter(Boolean))];
  const users = await User.find({ _id: { $in: userIds } }).select('name');
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u.name]));

  return invoices.map((inv) => ({
    ...toApi(inv),
    issued_by_name: userMap[String(inv.issued_by)] || null,
  }));
}

router.get('/', async (req, res) => {
  const { plate, from, to } = req.query;
  const filter = {};

  if (plate) filter.plate = { $regex: plate.toUpperCase(), $options: 'i' };
  if (from || to) {
    filter.created_at = {};
    if (from) filter.created_at.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.created_at.$lte = end;
    }
  }

  const invoices = await Invoice.find(filter).sort({ created_at: -1 }).limit(200);
  res.json(await enrichInvoices(invoices));
});

router.get('/number/:number', async (req, res) => {
  const invoice = await Invoice.findOne({ invoice_number: req.params.number });
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  const [enriched] = await enrichInvoices([invoice]);
  res.json(enriched);
});

router.get('/:id', async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  const [enriched] = await enrichInvoices([invoice]);
  res.json(enriched);
});

export default router;
