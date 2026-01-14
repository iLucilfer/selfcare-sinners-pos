const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const rateLimiter = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin','manager','cashier').default('cashier')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

router.post('/register', rateLimiter.strict, validate(registerSchema), ctrl.register);
router.post('/login', rateLimiter.strict, validate(loginSchema), ctrl.login);

module.exports = router;
