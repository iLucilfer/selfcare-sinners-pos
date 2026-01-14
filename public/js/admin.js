const api = (path, opts = {}) => fetch(`/api/${path}`, opts).then(async r => {
  const json = await r.json();
  if (!r.ok) throw json;
  return json;
});

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const body = {
    sku: form.sku.value,
    name: form.name.value,
    category: form.category.value,
    price: Number(form.price.value || 0),
    cost: Number(form.cost.value || 0),
    attributes: tryParseJSON(form.attributes.value) || {}
  };
  try {
    await fetch('/api/products', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
    }).then(r => r.json());
    alert('Producto creado');
    form.reset();
    loadInventory();
  } catch (err) {
    alert(err.message || 'Error');
  }
});

function tryParseJSON(str) {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

async function loadInventory() {
  try {
    const rows = await api('admin/inventory');
    const el = document.getElementById('inventoryList');
    el.innerHTML = '';
    rows.forEach(row => {
      const d = document.createElement('div');
      d.className = 'p-2 bg-gray-800 rounded flex justify-between';
      d.innerHTML = \`<div><div class="font-medium">\${row.name}</div><div class="text-sm opacity-70">\${row.sku || ''}</div></div><div>\${Number(row.quantity).toFixed(2)}</div>\`;
      el.appendChild(d);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadAnalytics() {
  const now = new Date();
  const to = now.toISOString();
  const from = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  try {
    const data = await api(\`admin/analytics?from=\${encodeURIComponent(from)}&to=\${encodeURIComponent(to)}\`);
    renderSalesChart(data.sales);
    renderTopProducts(data.topProducts);
  } catch (err) {
    console.error(err);
  }
}

function renderSalesChart(sales) {
  const ctx = document.getElementById('salesChart').getContext('2d');
  const labels = sales.map(r => new Date(r.day).toLocaleDateString());
  const totals = sales.map(r => Number(r.total));
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Ventas',
        data: totals,
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96,165,250,0.12)',
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

function renderTopProducts(list) {
  const el = document.getElementById('topProducts');
  el.innerHTML = '';
  list.forEach(p => {
    const li = document.createElement('li');
    li.className = 'p-2 bg-gray-800 rounded flex justify-between';
    li.innerHTML = \`<div>\${p.name || 'Sin nombre'}</div><div class="font-medium">\${Number(p.qty).toFixed(2)}</div>\`;
    el.appendChild(li);
  });
}

loadInventory();
loadAnalytics();
