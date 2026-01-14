const api = (path, opts = {}) => fetch(`/api/${path}`, opts).then(r => r.json());

const productsGrid = document.getElementById('productsGrid');
const searchInput = document.getElementById('search');
const cartItemsEl = document.getElementById('cartItems');
const subtotalEl = document.getElementById('subtotal');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');

let cart = [];

async function search(q = '') {
  const res = await api(`products/search?q=${encodeURIComponent(q)}`);
  renderProducts(res);
}

function renderProducts(products) {
  productsGrid.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'p-3 rounded bg-gray-900';
    card.innerHTML = \`
      <div class="font-semibold">\${p.name}</div>
      <div class="text-sm opacity-70">\${p.sku || ''} • \${p.category || ''}</div>
      <div class="mt-2 text-lg font-bold">\${Number(p.price).toFixed(2)} \${getCurrency()}</div>
      <div class="mt-3 flex items-center gap-2">
        <button data-id="\${p.id}" class="addBtn py-1 px-2 bg-emerald-500 rounded">Agregar</button>
        <button data-id="\${p.id}" class="detailsBtn py-1 px-2 bg-gray-800 rounded">Detalles</button>
      </div>
    \`;
    productsGrid.appendChild(card);
  });

  document.querySelectorAll('.addBtn').forEach(btn => btn.addEventListener('click', async (e) => {
    const id = e.target.getAttribute('data-id');
    const p = await api(`products/${id}`);
    addToCart({
      product_id: p.id,
      name: p.name,
      unit_price: Number(p.price),
      quantity: 1,
      attributes: p.attributes || {}
    });
  }));
}

function addToCart(item) {
  cart.push(item);
  renderCart();
}

function renderCart() {
  cartItemsEl.innerHTML = '';
  let subtotal = 0;
  cart.forEach((it, idx) => {
    const div = document.createElement('div');
    const lineTotal = (Number(it.unit_price) * Number(it.quantity));
    subtotal += lineTotal;
    div.className = 'p-2 bg-gray-900 rounded flex justify-between items-center';
    div.innerHTML = \`
      <div>
        <div class="font-medium">\${it.name}</div>
        <div class="text-sm opacity-70">\${formatAttributes(it.attributes)}</div>
        <div class="text-sm opacity-70">x\${it.quantity} • \${it.unit_price.toFixed(2)} \${getCurrency()}</div>
      </div>
      <div class="text-right">
        <div class="font-bold">\${lineTotal.toFixed(2)}</div>
        <div class="mt-2">
          <button data-idx="\${idx}" class="removeBtn text-sm text-red-400">Quitar</button>
        </div>
      </div>
    \`;
    cartItemsEl.appendChild(div);
  });

  document.querySelectorAll('.removeBtn').forEach(b => b.addEventListener('click', (e) => {
    const idx = Number(e.target.getAttribute('data-idx'));
    cart.splice(idx, 1);
    renderCart();
  }));

  const tax = subtotal * 0.12; // example tax 12%
  const total = subtotal + tax;
  subtotalEl.textContent = subtotal.toFixed(2);
  taxEl.textContent = tax.toFixed(2);
  totalEl.textContent = total.toFixed(2);
}

function formatAttributes(attrs) {
  if (!attrs) return '';
  return Object.entries(attrs).map(([k,v]) => \`\${k}: \${v}\`).join(' • ');
}

function getCurrency() {
  return (window.__CONFIG && window.__CONFIG.currency) ? window.__CONFIG.currency : 'USD';
}

searchInput.addEventListener('input', (e) => {
  const q = e.target.value;
  search(q);
});

document.getElementById('payCash').addEventListener('click', () => checkout('cash'));
document.getElementById('payCard').addEventListener('click', () => checkout('card'));
document.getElementById('payTransfer').addEventListener('click', () => checkout('transfer'));

async function checkout(method) {
  if (cart.length === 0) return alert('Carrito vacío');
  const items = cart.map(it => ({
    product_id: it.product_id,
    description: it.name,
    quantity: it.quantity,
    unit_price: it.unit_price,
    total: Number(it.unit_price) * Number(it.quantity),
    attributes: it.attributes
  }));
  const subtotal = Number(subtotalEl.textContent);
  const tax = Number(taxEl.textContent);
  const total = Number(totalEl.textContent);
  const payload = {
    cashier_id: null,
    items,
    payments: [{ method, amount: total }],
    subtotal, tax, total
  };
  const res = await fetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (res.ok) {
    const win = window.open();
    win.document.write(data.invoiceHtml);
    cart = [];
    renderCart();
  } else {
    alert(data.message || 'Error al cobrar');
  }
}

search('');
