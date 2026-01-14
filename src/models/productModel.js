const db = require('./db');

async function createProduct({ sku, name, description, category, price, cost, attributes }) {
  const q = \`
    INSERT INTO products (sku, name, description, category, price, cost, attributes)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *;
  \`;
  const res = await db.query(q, [sku, name, description, category, price, cost, attributes || {}]);
  return res.rows[0];
}

async function updateProduct(id, patch) {
  const fields = [];
  const values = [];
  let idx = 1;
  for (const key in patch) {
    fields.push(\`\${key} = $\${idx++}\`);
    values.push(patch[key]);
  }
  values.push(id);
  const q = \`UPDATE products SET \${fields.join(', ')} WHERE id = $\${idx} RETURNING *;\`;
  const res = await db.query(q, values);
  return res.rows[0];
}

async function getProductById(id) {
  const res = await db.query('SELECT * FROM products WHERE id = $1', [id]);
  return res.rows[0];
}

async function searchProducts(term, limit = 20) {
  const q = \`
    SELECT * FROM products
    WHERE active = true AND (lower(name) LIKE $1 OR sku LIKE $1 OR lower(category) LIKE $1)
    ORDER BY name
    LIMIT $2;
  \`;
  const res = await db.query(q, [\`%\${term.toLowerCase()}%\`, limit]);
  return res.rows;
}

module.exports = {
  createProduct,
  updateProduct,
  getProductById,
  searchProducts
};
