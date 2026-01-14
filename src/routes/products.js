const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productsController');
const validate = require('../middleware/validate');
const Joi = require('joi');
const { authenticate, roleGuard } = require('../middleware/auth');

// Schemas
const productSchema = Joi.object({
  sku: Joi.string().allow(null, '').max(64),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('', null),
  category: Joi.string().allow('', null),
  price: Joi.number().precision(2).min(0).required(),
  cost: Joi.number().precision(2).min(0).required(),
  attributes: Joi.object().unknown(true).default({}),
  active: Joi.boolean().default(true)
});

const productPatchSchema = Joi.object({
  sku: Joi.string().max(64),
  name: Joi.string().min(1).max(255),
  description: Joi.string().allow('', null),
  category: Joi.string().allow('', null),
  price: Joi.number().precision(2).min(0),
  cost: Joi.number().precision(2).min(0),
  attributes: Joi.object().unknown(true),
  active: Joi.boolean()
}).min(1);

// Public search & get
router.get('/search', ctrl.search);
router.get('/:id', ctrl.getProduct);

// Protected create/update (admin or manager)
router.post('/', authenticate, roleGuard(['admin', 'manager']), validate(productSchema), ctrl.createProduct);
router.put('/:id', authenticate, roleGuard(['admin', 'manager']), validate(productPatchSchema), ctrl.updateProduct);

module.exports = router;
