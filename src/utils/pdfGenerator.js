const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const db = require('../models/db');

async function renderInvoiceHtml(saleId) {
  const saleRes = await db.query('SELECT * FROM sales WHERE id = $1', [saleId]);
  const sale = saleRes.rows[0];
  if (!sale) throw new Error('Sale not found');

  const itemsRes = await db.query('SELECT * FROM sale_items WHERE sale_id = $1', [saleId]);
  const items = itemsRes.rows;

  const templatePath = path.join(__dirname, '..', '..', 'public', 'invoice_template.ejs');
  const template = fs.readFileSync(templatePath, 'utf8');

  const html = ejs.render(template, {
    sale,
    items,
    company: {
      name: process.env.COMPANY_NAME || 'Selfcare Sinners',
      slogan: 'FAST MONEY MAKERS',
      currency: process.env.COMPANY_CURRENCY || 'USD',
      logoUrl: process.env.COMPANY_LOGO_URL || '/public/logo.png'
    }
  });

  return html;
}

async function invoicePdfBuffer(invoiceHtml) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.setContent(invoiceHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { renderInvoiceHtml, invoicePdfBuffer };
