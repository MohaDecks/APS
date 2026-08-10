import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aps-airport-parking-jwt-2024-xK9mP2vL7nQ4wR8';

export function publicUser(user) {
  const id = String(user._id || user.id);
  return {
    id,
    email: user.email,
    name: user.name,
    role: user.role,
    can_update_payments: !!user.can_update_payments,
    can_update_price: !!user.can_update_price,
  };
}

export function signToken(user) {
  const u = publicUser(user);
  return jwt.sign(
    {
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.name,
      can_update_payments: u.can_update_payments,
      can_update_price: u.can_update_price,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function operatorOnly(req, res, next) {
  if (req.user.role !== 'operator') {
    return res.status(403).json({ error: 'Only operators can perform this action. Use the mobile app.' });
  }
  next();
}

export async function canUpdatePayments(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('role can_update_payments');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (!user.can_update_payments) {
      return res.status(403).json({ error: 'You do not have permission to update payments' });
    }
    next();
  } catch {
    res.status(500).json({ error: 'Permission check failed' });
  }
}

export async function canUpdatePrice(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('role can_update_price');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (!user.can_update_price) {
      return res.status(403).json({ error: 'You do not have permission to update pricing' });
    }
    next();
  } catch {
    res.status(500).json({ error: 'Permission check failed' });
  }
}
