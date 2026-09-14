// Runs daily via server crontab (same pattern as daily_article.js -- logs to
// stdout, crontab redirects to a file we can actually read; this is NOT a
// cloud routine, since that approach silently failed for the daily article
// job previously).
//
// Source: price.forsatnet.ir -- a stable, same-URL-every-day price table
// sourced from the construction materials sellers' union (اتحادیه صنف
// فروشندگان مصالح ساختمانی), not a one-off news article. Two pages: the
// general construction-materials page (cement/gypsum/brick/block) and the
// steel page (rebar). Sand/gravel was deliberately dropped -- no reliably
// daily-updating single source was found for it.
//
// Usage: cd /var/www/melkeeno && node scripts/update_material_prices.js
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

const MaterialPriceSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ['cement', 'rebar', 'brick', 'block', 'gypsum'], required: true },
    name: { type: String, required: true },
    spec: String,
    price: { type: Number, required: true },
    sourceUrl: String,
    fetchedAt: { type: Date, required: true },
  },
  { timestamps: true }
);
const MaterialPrice = mongoose.models.MaterialPrice || mongoose.model('MaterialPrice', MaterialPriceSchema);

const CONSTRUCTION_URL = 'https://price.forsatnet.ir/construction-materials.html';
const STEEL_URL = 'https://price.forsatnet.ir/steel-price.html';

const CATEGORY_KEYWORDS = [
  ['سیمان', 'cement'],
  ['گچ', 'gypsum'],
  ['آجر', 'brick'],
  ['بلوک', 'block'],
];

function parsePrice(raw) {
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function parseTableRows(html) {
  const tableMatch = html.match(/<table id="price"[\s\S]*?<\/table>/);
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

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Fetch failed for ${url}: ${res.status}`);
  return res.text();
}

async function scrapeConstructionMaterials(fetchedAt) {
  const html = await fetchHtml(CONSTRUCTION_URL);
  const rows = parseTableRows(html);
  const items = [];
  for (const cells of rows) {
    const [title, spec, priceRaw] = cells;
    if (!title || !priceRaw) continue;
    // Exclude adhesives/cleaners/etc. that merely mention a material in
    // passing (e.g. "چسب ... آجرنما" -- brick-facing adhesive, not brick).
    if (/چسب|پاک کننده|درزگیر|عایق/.test(title)) continue;
    const match = CATEGORY_KEYWORDS.find(([kw]) => title.includes(kw));
    if (!match) continue;
    items.push({
      category: match[1],
      name: title,
      spec: spec || '',
      price: parsePrice(priceRaw),
      sourceUrl: CONSTRUCTION_URL,
      fetchedAt,
    });
  }
  return items;
}

async function scrapeRebar(fetchedAt) {
  const html = await fetchHtml(STEEL_URL);
  const rows = parseTableRows(html);
  const items = [];
  for (const cells of rows) {
    const [title, priceRaw] = cells;
    if (!title || !priceRaw || !title.includes('میلگرد')) continue;
    items.push({
      category: 'rebar',
      name: title,
      spec: '',
      price: parsePrice(priceRaw),
      sourceUrl: STEEL_URL,
      fetchedAt,
    });
  }
  return items;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not found in .env.production');
  console.log(`[${new Date().toISOString()}] starting material price update`);

  const fetchedAt = new Date();
  const [materials, rebar] = await Promise.all([
    scrapeConstructionMaterials(fetchedAt),
    scrapeRebar(fetchedAt),
  ]);
  const items = [...materials, ...rebar];

  if (items.length === 0) {
    throw new Error('Scrape produced zero items -- source page structure likely changed, aborting without touching DB');
  }

  const counts = items.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});
  console.log('scraped counts:', counts);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('connected to MongoDB');

  await MaterialPrice.deleteMany({});
  await MaterialPrice.insertMany(items);
  console.log(`SUCCESS: replaced material prices with ${items.length} fresh items`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  console.error(err.stack);
  process.exitCode = 1;
});
