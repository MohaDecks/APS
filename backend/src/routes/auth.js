import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken, authMiddleware } from '../middleware/auth.js';
import { toApi } from '../utils/format.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, email, password } = req.body;
  const identifier = (username || email || '').trim();
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const lower = identifier.toLowerCase();
  const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const user = await User.findOne({
    $or: [
      { email: lower },
      { name: new RegExp(`^${escaped}$`, 'i') },
    ],
  });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signToken(user);
  const apiUser = toApi(user);
  res.json({
    token,
    user: { id: apiUser.id, email: apiUser.email, name: apiUser.name, role: apiUser.role },
  });
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('email name role created_at');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(toApi(user));
});

export default router;
