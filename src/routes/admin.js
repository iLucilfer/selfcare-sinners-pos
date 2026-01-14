const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { authenticate, roleGuard } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Joi = require('joi');

const inventorySchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  location: Joi.string().default('main'),
  quantity: Joi.number().required(),
  unit: Joi.string().default('unit'),
  reorder_level: Joi.number().default(0)
});

const templateSchema = Joi.object({
  name: Joi.string().min(2).required(),
  schema: Joi.object().required()
});

const userCreateSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin','manager','cashier').default('cashier')
});

// All admin routes require auth + admin/manager role (creating users restricted to 'admin')
router.use(authenticate, roleGuard(['admin','manager']));

router.get('/inventory', ctrl.listInventory);
router.post('/inventory', validate(inventorySchema), ctrl.upsertInventory);

// Attribute templates CRUD
router.post('/templates', validate(templateSchema), ctrl.createTemplate);
router.get('/templates', ctrl.listTemplates);
router.put('/templates/:id', validate(templateSchema), ctrl.updateTemplate);
router.delete('/templates/:id', ctrl.deleteTemplate);

// Analytics
router.get('/analytics', ctrl.analytics);

// Create user (only admin)
router.post('/users', roleGuard('admin'), validate(userCreateSchema), ctrl.createUserAdmin);

module.exports = router;
