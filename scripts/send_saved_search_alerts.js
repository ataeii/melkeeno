// Dispatch worker for the Telegram "follow this search" feature (see
// models/SavedSearch.js and the `ss:`/`sx:` callbacks in
// app/api/telegram/webhook/route.js). Standalone script, not imported into
// the Next.js app -- same convention as update_material_prices.js and
// update_supplier_prices.js, duplicating the small amount of shared logic
// (the SavedSearch schema, the Telegram-via-relay call) rather than
// importing app code, since this runs via cron outside the app process.
//
// Dedup is token-based (notifiedTokens on each SavedSearch doc), not
// date-based -- a listing's scraped_at gets bumped on every re-scrape even
// when it isn't new, so "scraped since last check" would re-alert on
// every listing every time the scrapers run.
//
// Usage: cd /var/www/melkeeno && node scripts/send_saved_search_alerts.js
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

const SavedSearchSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true },
    listingType: { type: String, default: 'buy' },
    district: String,
    districtLabel: { type: String, required: true },
    rooms: Number,
    minRooms: Number,
    notifiedTokens: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const SavedSearch = mongoose.models.SavedSearch || mongoose.model('SavedSearch', SavedSearchSchema);

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const MAX_INDIVIDUAL_ALERTS = 5; // beyond this, just say "+N more" rather than flooding the chat
const MAX_NOTIFIED_TOKENS = 500; // bound array growth on long-lived searches

function formatToman(n) {
  if (!n) return null;
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' میلیارد تومان';
  if (n >= 1e6) return (n / 1e6).toFixed(0) + ' میلیون تومان';
  return n.toLocaleString('en-US') + ' تومان';
}

async function fetchMatches(search) {
  const params = new URLSearchParams({ listing_type: search.listingType || 'buy', sort: 'price_asc' });
  if (search.district) params.set('district', search.district);
  if (search.minRooms) params.set('min_rooms', String(search.minRooms));
  else if (search.rooms) params.set('rooms', String(search.rooms));
  const res = await fetch(`${API}/api/listings?${params}`);
  if (!res.ok) throw new Error(`listings fetch failed: ${res.status}`);
  return res.json();
}

async function callTelegram(method, payload) {
  const res = await fetch(process.env.RELAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-relay-secret': process.env.RELAY_SECRET },
    body: JSON.stringify({ service: 'telegram', method, payload }),
  });
  if (!res.ok) throw new Error(`relay failed for ${method}: ${res.status} ${await res.text().catch(() => '')}`);
  return res.json();
}

function sendMessage(chatId, text, extra = {}) {
  return callTelegram('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });
}

function sendPhoto(chatId, photo, caption, extra = {}) {
  return callTelegram('sendPhoto', { chat_id: chatId, photo, caption, parse_mode: 'HTML', ...extra });
}

function listingCaption(listing) {
  const lines = [`<b>${listing.title || 'آگهی ملک'}</b>`];
  if (listing.district) lines.push(`📍 ${listing.district}`);
  const specs = [];
  if (listing.area_m2) specs.push(`${listing.area_m2} م²`);
  if (listing.rooms != null && listing.rooms > 0) specs.push(`${listing.rooms} خواب`);
  if (specs.length) lines.push(specs.join(' · '));
  if (listing.price) lines.push(`💰 ${formatToman(listing.price)}`);
  else if (listing.rent) lines.push(`💰 ${formatToman(listing.rent)}/ماه`);
  return lines.join('\n');
}

async function processSearch(search) {
  const matches = await fetchMatches(search);
  const seen = new Set(search.notifiedTokens);
  const fresh = matches.filter((l) => !seen.has(l.token));

  if (fresh.length > 0) {
    await sendMessage(
      search.chatId,
      `🔔 ${fresh.length} آگهی جدید در «${search.districtLabel}» پیدا شد:`
    );
    for (const listing of fresh.slice(0, MAX_INDIVIDUAL_ALERTS)) {
      const caption = listingCaption(listing);
      // melkeeno's own listing page, not the external Divar/kilid URL --
      // same reasoning as the /search bot flow in the webhook route.
      const reply_markup = {
        inline_keyboard: [[{ text: 'مشاهده در ملکینو ↗', url: `https://khanedade.ir/properties/listing/${listing.token}` }]],
      };
      if (listing.image_url) {
        await sendPhoto(search.chatId, listing.image_url, caption, { reply_markup });
      } else {
        await sendMessage(search.chatId, caption, { reply_markup });
      }
    }
    if (fresh.length > MAX_INDIVIDUAL_ALERTS) {
      await sendMessage(search.chatId, `و ${fresh.length - MAX_INDIVIDUAL_ALERTS} آگهی دیگر.`);
    }
  }

  const allTokens = [...new Set([...search.notifiedTokens, ...matches.map((l) => l.token)])];
  const notifiedTokens = allTokens.slice(-MAX_NOTIFIED_TOKENS);
  await SavedSearch.updateOne({ _id: search._id }, { $set: { notifiedTokens } });

  return fresh.length;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not found in .env.production');
  if (!process.env.RELAY_URL) throw new Error('RELAY_URL not found in .env.production');

  await mongoose.connect(process.env.MONGODB_URI);
  const searches = await SavedSearch.find({ active: true }).lean();
  console.log(`[${new Date().toISOString()}] checking ${searches.length} active saved searches`);

  let totalAlerts = 0;
  for (const search of searches) {
    try {
      totalAlerts += await processSearch(search);
    } catch (err) {
      console.error(`search ${search._id} failed:`, err.message);
    }
  }

  console.log(`done -- sent alerts for ${totalAlerts} new listing(s) across ${searches.length} searches`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  console.error(err.stack);
  process.exitCode = 1;
});
