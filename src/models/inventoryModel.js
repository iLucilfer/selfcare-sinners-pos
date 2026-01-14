const db = require('./db');

async function listInventory() {
  const q = \`
    SELECT i.*, p.name, p.sku
    FROM inventory i
    LEFT JOIN products p ON p.id = i.product_id
    ORDER BY p.name NULLS LAST
  \`;
  const res = await db.query(q);
  return res.rows;
}

async function getByProduct(productId, location = 'main') {
  const res = await db.query('SELECT * FROM inventory WHERE product_id=$1 AND location=$2', [productId, location]);
  return res.rows[0];
}

async function upsertInventory({ product_id, location = 'main', quantity = 0, unit = 'unit', reorder_level = 0 }) {
  const existing = await getByProduct(product_id, location);
  if (existing) {
    const res = await db.query(
      \`UPDATE inventory SET quantity=$1, unit=$2, reorder_level=$3, updated_at=now() WHERE id=$4 RETURNING *\`,
      [quantity, unit, reorder_level, existing.id]
    );
    return res.rows[0];
  } else {
    const res = await db.query(
      \`INSERT INTO inventory (product_id, location, quantity, unit, reorder_level) VALUES ($1,$2,$3,$4,$5) RETURNING *\`,
      [product_id, location, quantity, unit, reorder_level]
    );
    return res.rows[0];
  }
}

module.exports = { listInventory, getByProduct, upsertInventory };
