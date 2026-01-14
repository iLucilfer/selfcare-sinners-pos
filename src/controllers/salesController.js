const salesModel = require('../models/salesModel');
const pdfGen = require('../utils/pdfGenerator');
const db = require('../models/db');

/**
 * Helper: compara floats con tolerancia
 */
function approxEqual(a, b, eps = 0.01) {
  return Math.abs(Number(a) - Number(b)) <= eps;
}

async function createSale(req, res, next) {
  try {
    const { items = [], payments = [], subtotal = 0, tax = 0, total = 0 } = req.body;

    // Validaciones previas
    const itemsSum = items.reduce((s, it) => s + Number(it.total || 0), 0);
    if (!approxEqual(itemsSum, Number(subtotal))) {
      return res.status(400).json({ message: 'Subtotal mismatch with items total', itemsSum, subtotal });
    }

    if (!approxEqual(Number(subtotal) + Number(tax), Number(total))) {
      return res.status(400).json({ message: 'Total mismatch: subtotal + tax !== total', subtotal, tax, total });
    }

    const paymentsSum = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    if (!approxEqual(paymentsSum, Number(total))) {
      return res.status(400).json({ message: 'Payments do not sum to total', paymentsSum, total });
    }

    // Si se usa autenticación, asignar cashier_id automáticamente
    const cashier_id = req.user ? req.user.id : (req.body.cashier_id || null);

    const result = await salesModel.createSale({
      cashier_id,
      items,
      payments,
      subtotal,
      tax,
      total
    });

    // Render invoice HTML and persist snapshot
    const invoiceHtml = await pdfGen.renderInvoiceHtml(result.sale.id);
    await db.query(\`INSERT INTO invoices (sale_id, invoice_html) VALUES ($1,$2)\`, [result.sale.id, invoiceHtml]);

    res.status(201).json({ sale: result.sale, items: result.items, payments: result.payments, invoiceHtml });
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('insufficient stock')) {
      return res.status(409).json({ message: err.message });
    }
    next(err);
  }
}

async function salesReport(req, res, next) {
  try {
    const { from, to } = req.query;
    const rows = await salesModel.getSalesBetween(from, to);
    const total = rows.reduce((s, r) => s + Number(r.total || 0), 0);
    res.json({ rows, total });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSale, salesReport };
