// Pilot for the per-material supplier comparison pages (Torob-style),
// 2026-09-08. Covers 2 real suppliers to start, picked after checking by
// hand which sites in materials/page.jsx's old "buy online" link list
// actually sell building materials with real, current, plain-HTML prices:
// mahmilstore.com turned out to be a general appliance store, and
// gachland.com's entire catalog reads as "outofstock" site-wide (couldn't
// tell if that's real unavailability or a call-to-order business model,
// so it was dropped rather than guessing and showing possibly-stale
// prices as live).
//
//   - ahanonline.com: rebar -- their own site is itself a factory-price
//     comparison table per rebar size (<table>, same shape
//     update_material_prices.js already parses), dated same-day.
//   - alborzmasaleh.com (WooCommerce/Woodmart): cement, brick, block, and
//     (as a single item, found mixed into the "masonry wall" category
//     rather than its own) gypsum -- archive pages list price + real
//     "instock"/"outofstock" status inline (verified both states
//     actually occur on this site, unlike gachland).
//
// Prices on alborzmasaleh are in Persian digits (۰-۹) and variable
// products show a price *range* (e.g. "۳۴۰,۰۰۰ – ۲۶۰,۰۰۰") -- takes the
// minimum of all amounts found, i.e. the "starting from" price.
//
// Usage: cd /var/www/melkeeno && node scripts/update_supplier_prices.js
'use strict';
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnv(file) {
  const content = fs.readFileSync(file, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(path.join(__dirname, '..', '.env.production'));

const SupplierPriceSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ['cement', 'rebar', 'brick', 'block', 'gypsum'], required: true },
    supplier: { type: String, required: true },
    supplierName: { type: String, required: true },
    name: { type: String, required: true },
    spec: String,
    price: { type: Number, required: true },
    productUrl: { type: String, required: true },
    fetchedAt: { type: Date, required: true },
  },
  { timestamps: true }
);
const SupplierPrice = mongoose.models.SupplierPrice || mongoose.model('SupplierPrice', SupplierPriceSchema);

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Fetch failed for ${url}: ${res.status}`);
  return res.text();
}

function parsePrice(raw) {
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

const toLatinDigits = (s) => s.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

// Splits a WooCommerce archive page into per-product HTML chunks using the
// "type-product" class marker every theme's product loop item carries.
function splitProductBlocks(html) {
  const classRe = /class="[^"]*type-product[^"]*"/g;
  const matches = [...html.matchAll(classRe)];
  return matches.map((m, i) => ({
    classAttr: m[0],
    html: html.slice(m.index, matches[i + 1] ? matches[i + 1].index : html.length),
  }));
}

// ---- alborzmasaleh.com (WooCommerce archive pages, Persian-digit prices) ----
const ALBORZ_MASALEH_PAGES = [
  { url: 'https://www.alborzmasaleh.com/product-category/cement/', classify: () => 'cement' },
  {
    url: 'https://www.alborzmasaleh.com/product-category/%d8%af%db%8c%d9%88%d8%a7%d8%b1-%da%86%db%8c%d9%86%db%8c/',
    // Mixed-use category despite its "masonry wall" name -- also carries a
    // prefab gypsum-wall product, so gypsum must be checked before block/brick.
    classify: (name) => (name.includes('گچ') ? 'gypsum' : name.includes('بلوک') ? 'block' : 'brick'),
  },
];

function scrapeAlborzMasalehPage(html, classify, fetchedAt) {
  const items = [];
  for (const { classAttr, html: block } of splitProductBlocks(html)) {
    if (classAttr.includes('outofstock')) continue;
    const nameMatch = block.match(/wd-entities-title">\s*<a[^>]*>([^<]+)</);
    const urlMatch = block.match(/href="(https:\/\/www\.alborzmasaleh\.com\/product\/[^"]+)"/);
    const priceMatches = [...block.matchAll(/<bdi>([۰-۹0-9,]+)/g)].map((m) => parsePrice(toLatinDigits(m[1])));
    if (!nameMatch || !urlMatch || priceMatches.length === 0) continue;
    const price = Math.min(...priceMatches.filter(Boolean));
    if (!price) continue;
    items.push({
      category: classify(nameMatch[1]),
      supplier: 'alborzmasaleh',
      supplierName: 'البرز مصالح',
      name: nameMatch[1].trim(),
      spec: '',
      price,
      productUrl: urlMatch[1],
      fetchedAt,
    });
  }
  return items;
}

async function scrapeAlborzMasaleh(fetchedAt) {
  const items = [];
  for (const { url, classify } of ALBORZ_MASALEH_PAGES) {
    try {
      const html = await fetchHtml(url);
      items.push(...scrapeAlborzMasalehPage(html, classify, fetchedAt));
    } catch (err) {
      console.error(`alborzmasaleh ${url} failed:`, err.message);
    }
  }
  return items;
}

// ---- ahanonline.com (rebar price table, one page per size) ----
const AHANONLINE_REBAR_SIZES = ['8', '10', '12', '14', '16', '18', '20', '22', '25'];

function ahanonlineUrl(size) {
  return `https://ahanonline.com/product-category/%D9%85%DB%8C%D9%84%DA%AF%D8%B1%D8%AF/%D9%82%DB%8C%D9%85%D8%AA-%D9%85%DB%8C%D9%84%DA%AF%D8%B1%D8%AF/%D9%85%DB%8C%D9%84%DA%AF%D8%B1%D8%AF-${size}/`;
}

function parseTableRows(html) {
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/);
  if (!tableMatch) return [];
  const rows = tableMatch[0].match(/<tr[\s\S]*?<\/tr>/g) || [];
  return rows.map((row) => {
    const cells = row.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g) || [];
    return cells.map((c) =>
      c
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    );
  });
}

async function scrapeAhanonline(fetchedAt) {
  const items = [];
  const seen = new Set(); // de-dup identical product names across size pages
  for (const size of AHANONLINE_REBAR_SIZES) {
    const url = ahanonlineUrl(size);
    try {
      const html = await fetchHtml(url);
      const rows = parseTableRows(html);
      for (const cells of rows) {
        if (cells.length !== 3) continue; // skip metadata rows (date/trend)
        const [name, unit, priceRaw] = cells;
        if (!name.includes('میلگرد') || !unit || !priceRaw) continue;
        const price = parsePrice(priceRaw);
        if (!price || seen.has(name)) continue;
        seen.add(name);
        items.push({
          category: 'rebar',
          supplier: 'ahanonline',
          supplierName: 'آهن آنلاین',
          name,
          spec: unit,
          price,
          productUrl: url,
          fetchedAt,
        });
      }
    } catch (err) {
      console.error(`ahanonline size ${size} failed:`, err.message);
    }
  }
  return items;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not found in .env.production');
  console.log(`[${new Date().toISOString()}] starting supplier price update`);

  const fetchedAt = new Date();
  const [alborz, ahanonline] = await Promise.all([scrapeAlborzMasaleh(fetchedAt), scrapeAhanonline(fetchedAt)]);
  const items = [...alborz, ...ahanonline];

  if (items.length === 0) {
    throw new Error('Scrape produced zero items -- source page structure likely changed, aborting without touching DB');
  }

  const counts = items.reduce((acc, i) => {
    acc[`${i.supplier}/${i.category}`] = (acc[`${i.supplier}/${i.category}`] || 0) + 1;
    return acc;
  }, {});
  console.log('scraped counts:', counts);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('connected to MongoDB');

  // Only replace listings for suppliers this run actually covers, so a
  // future supplier's data (added by a different run) isn't wiped out.
  const suppliers = [...new Set(items.map((i) => i.supplier))];
  await SupplierPrice.deleteMany({ supplier: { $in: suppliers } });
  await SupplierPrice.insertMany(items);
  console.log(`SUCCESS: replaced supplier prices for [${suppliers.join(', ')}] with ${items.length} fresh items`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  console.error(err.stack);
  process.exitCode = 1;
});
