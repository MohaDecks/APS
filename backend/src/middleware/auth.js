import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'airport-parking-secret-key-2024';

export function signToken(user) {
  const id = String(user._id || user.id);
  return jwt.sign({ id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, {
    expiresIn: '7d',
  });
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
