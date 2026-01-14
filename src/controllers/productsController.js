const productModel = require('../models/productModel');

/**
 * Controller: create product
 * Body: { sku, name, description, category, price, cost, attributes }
 */
async function createProduct(req, res, next) {
  try {
    const p = await productModel.createProduct(req.body);
    res.status(201).json(p);
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const updated = await productModel.updateProduct(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const p = await productModel.getProductById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (err) {
    next(err);
  }
}

async function search(req, res, next) {
  try {
    const term = req.query.q || '';
    const results = await productModel.searchProducts(term, 30);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = { createProduct, updateProduct, getProduct, search };
