const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/salesController');
const validate = require('../middleware/validate');
const Joi = require('joi');
const { authenticate } = require('../middleware/auth');

// Schemas
const saleItemSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  description: Joi.string().allow('', null),
  quantity: Joi.number().positive().required(),
  unit_price: Joi.number().precision(2).min(0).required(),
  total: Joi.number().precision(2).min(0).required(),
  attributes: Joi.object().unknown(true).default({})
});

const paymentSchema = Joi.object({
  method: Joi.string().valid('cash', 'card', 'transfer').required(),
  amount: Joi.number().precision(2).positive().required(),
  metadata: Joi.object().unknown(true).default({})
});

const saleSchema = Joi.object({
  cashier_id: Joi.string().uuid().allow(null),
  items: Joi.array().items(saleItemSchema).min(1).required(),
  payments: Joi.array().items(paymentSchema).min(1).required(),
  subtotal: Joi.number().precision(2).min(0).required(),
  tax: Joi.number().precision(2).min(0).required(),
  total: Joi.number().precision(2).min(0).required()
});

router.post('/', /*authenticate,*/ validate(saleSchema), ctrl.createSale);
// Note: authentication optional for POS; if you want to require logged cashier uncomment authenticate

router.get('/report', ctrl.salesReport);

module.exports = router;
