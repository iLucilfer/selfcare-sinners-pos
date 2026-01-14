const jwt = require('jsonwebtoken');
const db = require('../models/db');

const JWT_SECRET = process.env.JWT_SECRET || 'replace_with_secure_value';

function signToken(user) {
  const payload = { id: user.id, role: user.role, email: user.email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '7d' });
}

async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'No token provided' });
    const parts = auth.split(' ');
    if (parts.length !== 2) return res.status(401).json({ message: 'Bad token format' });
    const token = parts[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const r = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
    const user = r.rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid token (user not found)' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized', error: err.message });
  }
}

/**
 * roleGuard('admin') or roleGuard(['admin','manager'])
 */
function roleGuard(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No user' });
    if (!allowed.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

module.exports = { authenticate, roleGuard, signToken };
