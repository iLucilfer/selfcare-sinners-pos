const inventoryModel = require('../models/inventoryModel');
const attributeModel = require('../models/attributeTemplateModel');
const db = require('../models/db');
const userModel = require('../models/userModel');
const { signToken } = require('../middleware/auth');

/* Inventory */
async function listInventory(req, res, next) {
  try {
    const rows = await inventoryModel.listInventory();
    res.json(rows);
  } catch (err) { next(err); }
}

async function upsertInventory(req, res, next) {
  try {
    const { product_id, location, quantity, unit, reorder_level } = req.body;
    const row = await inventoryModel.upsertInventory({ product_id, location, quantity, unit, reorder_level });
    res.json(row);
  } catch (err) { next(err); }
}

/* Attribute templates */
async function createTemplate(req, res, next) {
  try {
    const row = await attributeModel.createTemplate(req.body);
    res.status(201).json(row);
  } catch (err) { next(err); }
}

async function listTemplates(req, res, next) {
  try {
    const rows = await attributeModel.listTemplates();
    res.json(rows);
  } catch (err) { next(err); }
}

async function updateTemplate(req, res, next) {
  try {
    const row = await attributeModel.updateTemplate(req.params.id, req.body);
    res.json(row);
  } catch (err) { next(err); }
}

async function deleteTemplate(req, res, next) {
  try {
    await attributeModel.deleteTemplate(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

/* Analytics for Chart.js */
async function analytics(req, res, next) {
  try {
    const { from, to } = req.query;
    const salesQ = \`
      SELECT date_trunc('day', created_at) AS day, COUNT(*) AS count, SUM(total) AS total
      FROM sales
      WHERE created_at BETWEEN $1::timestamp AND $2::timestamp
      GROUP BY day ORDER BY day;
    \`;
    const salesRes = await db.query(salesQ, [from, to]);
    const topQ = \`
      SELECT si.product_id, p.name, SUM(si.quantity) AS qty, SUM(si.total) AS revenue
      FROM sale_items si
      LEFT JOIN products p ON p.id = si.product_id
      JOIN sales s ON s.id = si.sale_id
      WHERE s.created_at BETWEEN $1::timestamp AND $2::timestamp
      GROUP BY si.product_id, p.name
      ORDER BY qty DESC
      LIMIT 10;
    \`;
    const topRes = await db.query(topQ, [from, to]);
    res.json({
      sales: salesRes.rows,
      topProducts: topRes.rows
    });
  } catch (err) { next(err); }
}

/* Admin: create user */
async function createUserAdmin(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const exists = await userModel.findByEmail(email);
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const user = await userModel.createUser({ name, email, password, role });
    delete user.password_hash;
    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listInventory, upsertInventory,
  createTemplate, listTemplates, updateTemplate, deleteTemplate,
  analytics,
  createUserAdmin
};
