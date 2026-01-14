const db = require('./db');
const { v4: uuidv4 } = require('uuid');

/**
 * createSale: crea la venta dentro de una transacción
 * - Verifica stock con SELECT ... FOR UPDATE
 * - Descensa inventory únicamente si hay suficiente stock
 * - Inserta sale, sale_items y payments
 * - Hace COMMIT o ROLLBACK en caso de error
 *
 * Parámetro: { cashier_id, items = [], payments = [], subtotal, tax, total }
 */
async function createSale({ cashier_id = null, items = [], payments = [], subtotal = 0, tax = 0, total = 0 }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const reference = \`S-\${Date.now().toString(36)}-\${Math.floor(Math.random()*9000+1000)}\`;

    const insertSaleQ = \`
      INSERT INTO sales (reference, cashier_id, subtotal, tax, total, metadata)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;
    \`;
    const saleRes = await client.query(insertSaleQ, [reference, cashier_id, subtotal, tax, total, {}]);
    const sale = saleRes.rows[0];

    // For each item: lock inventory row, verify, update
    for (const item of items) {
      // Lock inventory row for this product (first available row)
      const invQ = \`SELECT id, quantity, unit FROM inventory WHERE product_id = $1 FOR UPDATE\`;
      const invRes = await client.query(invQ, [item.product_id]);

      if (invRes.rowCount === 0) {
        throw new Error(\`No inventory record found for product \${item.product_id}\`);
      }

      // Simple strategy: try to consume from the first locked row
      const inv = invRes.rows[0];
      const currentQty = Number(inv.quantity || 0);
      const neededQty = Number(item.quantity || 0);

      if (currentQty < neededQty) {
        throw new Error(\`Insufficient stock for product \${item.product_id} (need \${neededQty}, have \${currentQty})\`);
      }

      // decrement
      const updQ = \`UPDATE inventory SET quantity = quantity - $1, updated_at = now() WHERE id = $2\`;
      await client.query(updQ, [neededQty, inv.id]);

      // insert sale item
      const insItemQ = \`
        INSERT INTO sale_items (sale_id, product_id, description, quantity, unit_price, total, attributes)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      \`;
      await client.query(insItemQ, [
        sale.id,
        item.product_id,
        item.description || item.name || null,
        item.quantity,
        item.unit_price,
        item.total,
        item.attributes || {}
      ]);
    }

    // insert payments
    for (const p of payments) {
      const insPayQ = \`INSERT INTO payments (sale_id, method, amount, metadata) VALUES ($1,$2,$3,$4) RETURNING *\`;
      await client.query(insPayQ, [sale.id, p.method, p.amount, p.metadata || {}]);
    }

    await client.query('COMMIT');

    // Optionally, return sale with items & payments
    const saleItemsRes = await client.query('SELECT * FROM sale_items WHERE sale_id = $1', [sale.id]);
    const paymentsRes = await client.query('SELECT * FROM payments WHERE sale_id = $1', [sale.id]);

    return {
      sale,
      items: saleItemsRes.rows,
      payments: paymentsRes.rows
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => { /* ignore rollback error */ });
    throw err;
  } finally {
    client.release();
  }
}

async function getSalesBetween(from, to) {
  const res = await db.query(\`SELECT * FROM sales WHERE created_at BETWEEN $1 AND $2 ORDER BY created_at DESC\`, [from, to]);
  return res.rows;
}

module.exports = { createSale, getSalesBetween };
