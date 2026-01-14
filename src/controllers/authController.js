const userModel = require('../models/userModel');
const { signToken } = require('../middleware/auth');

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const exists = await userModel.findByEmail(email);
    if (exists) return res.status(409).json({ message: 'Email already registered' });
    const user = await userModel.createUser({ name, email, password, role });
    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await userModel.findByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await userModel.verifyPassword(user, password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(user);
    delete user.password_hash;
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
