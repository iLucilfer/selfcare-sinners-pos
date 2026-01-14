const db = require('./db');
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10;

async function createUser({ name, email, password, role = 'cashier' }) {
  const hash = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;
  const q = \`INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role,created_at\`;
  const res = await db.query(q, [name, email, hash, role]);
  return res.rows[0];
}

async function findByEmail(email) {
  const res = await db.query('SELECT * FROM users WHERE lower(email)=lower($1)', [email]);
  return res.rows[0];
}

async function verifyPassword(user, password) {
  if (!user || !user.password_hash) return false;
  return bcrypt.compare(password, user.password_hash);
}

module.exports = { createUser, findByEmail, verifyPassword };
