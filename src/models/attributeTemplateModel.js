const db = require('./db');

async function createTemplate({ name, schema }) {
  const res = await db.query('INSERT INTO attribute_templates (name, schema) VALUES ($1,$2) RETURNING *', [name, schema]);
  return res.rows[0];
}

async function listTemplates() {
  const res = await db.query('SELECT * FROM attribute_templates ORDER BY name');
  return res.rows;
}

async function getTemplate(id) {
  const res = await db.query('SELECT * FROM attribute_templates WHERE id=$1', [id]);
  return res.rows[0];
}

async function updateTemplate(id, patch) {
  const fields = [];
  const values = [];
  let idx = 1;
  for (const k in patch) {
    fields.push(\`\${k} = $\${idx++}\`);
    values.push(patch[k]);
  }
  values.push(id);
  const q = \`UPDATE attribute_templates SET \${fields.join(', ')} WHERE id = $\${idx} RETURNING *\`;
  const res = await db.query(q, values);
  return res.rows[0];
}

async function deleteTemplate(id) {
  await db.query('DELETE FROM attribute_templates WHERE id=$1', [id]);
  return true;
}

module.exports = { createTemplate, listTemplates, getTemplate, updateTemplate, deleteTemplate };
