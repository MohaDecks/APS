import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { toApi, toApiList } from '../utils/format.js';

const router = Router();

router.use(authMiddleware, adminOnly);

router.get('/', async (req, res) => {
  const users = await User.find().select('email name role created_at').sort({ created_at: -1 });
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
  const userRole = role;
  const hash = bcrypt.hashSync(password, 10);
  try {
    const user = await User.create({ email: email.toLowerCase(), password: hash, name, role: userRole });
    res.status(201).json(toApi(user));
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    throw e;
  }
});

router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
