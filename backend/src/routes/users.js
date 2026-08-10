import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { toApi, toApiList } from '../utils/format.js';

const router = Router();

router.use(authMiddleware, adminOnly);

const USER_SELECT = 'email name role can_update_payments can_update_price created_at';

function asBool(v) {
  return v === true || v === 1 || v === '1' || v === 'true';
}

router.get('/', async (req, res) => {
  const users = await User.find().select(USER_SELECT).sort({ created_at: -1 });
  res.json(toApiList(users));
});

router.post('/', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name required' });
  }
  if (!['admin', 'operator'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or operator' });
  }
  const isAdmin = role === 'admin';
  const hash = bcrypt.hashSync(password, 10);
  try {
    const user = await User.create({
      email: email.toLowerCase(),
      password: hash,
      name,
      role,
      can_update_payments: isAdmin ? asBool(req.body.can_update_payments) : false,
      can_update_price: isAdmin ? asBool(req.body.can_update_price) : false,
    });
    const safe = await User.findById(user._id).select(USER_SELECT);
    res.status(201).json(toApi(safe));
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    throw e;
  }
});

router.put('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (req.body.name) user.name = req.body.name.trim();

  if (req.body.role === 'admin' || req.body.role === 'operator') {
    user.role = req.body.role;
  }

  if (user.role === 'admin') {
    if (req.body.can_update_payments != null) {
      user.can_update_payments = asBool(req.body.can_update_payments);
    }
    if (req.body.can_update_price != null) {
      user.can_update_price = asBool(req.body.can_update_price);
    }
  } else {
    user.can_update_payments = false;
    user.can_update_price = false;
  }

  await user.save();
  const safe = await User.findById(user._id).select(USER_SELECT);
  res.json(toApi(safe));
});

router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
