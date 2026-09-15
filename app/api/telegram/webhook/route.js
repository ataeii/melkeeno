import { sendTelegramMessage, sendTelegramPhoto, answerCallbackQuery } from '@/lib/telegram';
import { fetchListings } from '@/lib/api';
import connectDB from '@/config/database';
import SavedSearch from '@/models/SavedSearch';

export const dynamic = 'force-dynamic';

// A curated shortlist rather than every scraped district -- keeps the
// inline keyboard usable. Referenced by index in callback_data to stay well
// under Telegram's 64-byte limit regardless of district name length.
const DISTRICTS = ['پونک', 'شهرک چیتگر', 'گیشا', 'سعادت‌آباد', 'جنت‌آباد جنوبی', 'نیلوفر', 'فلاح', 'جنت‌آباد شمالی'];
const PAGE_SIZE = 5;

const VERDICT_LABEL = {
  below_market: '🟢 زیر قیمت بازار',
  fair: '⚪️ قیمت منصفانه',
  above_market: '🔴 بالای قیمت بازار',
};

function formatToman(n) {
  if (!n) return null;
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' میلیارد تومان';
  if (n >= 1e6) return (n / 1e6).toFixed(0) + ' میلیون تومان';
  return n.toLocaleString('en-US') + ' تومان';
}

function districtKeyboard() {
  const rows = [];
  for (let i = 0; i < DISTRICTS.length; i += 2) {
    rows.push(DISTRICTS.slice(i, i + 2).map((d, j) => ({ text: d, callback_data: `sd:${i + j}` })));
  }
  rows.push([{ text: '🏙 همه مناطق', callback_data: 'sd:x' }]);
  return { inline_keyboard: rows };
}

function roomsKeyboard(districtIdx) {
  return {
    inline_keyboard: [
      [
        { text: '۱ خواب', callback_data: `sp:${districtIdx}:1:0` },
        { text: '۲ خواب', callback_data: `sp:${districtIdx}:2:0` },
      ],
      [
        { text: '۳ خواب یا بیشتر', callback_data: `sp:${districtIdx}:3:0` },
        { text: 'فرقی نمی‌کند', callback_data: `sp:${districtIdx}:x:0` },
      ],
    ],
  };
}

async function fetchResults(districtIdx, roomsCode) {
  const params = { listing_type: 'buy', sort: 'price_asc' };
  if (districtIdx !== 'x') params.district = DISTRICTS[Number(districtIdx)];
  if (roomsCode === '3') params.min_rooms = 3;
  else if (roomsCode !== 'x') params.rooms = Number(roomsCode);
  return fetchListings(params);
}

function listingCaption(listing) {
  const lines = [`<b>${listing.title || 'آگهی ملک'}</b>`];
  if (listing.district) lines.push(`📍 ${listing.district}`);

  const specs = [];
  if (listing.area_m2) specs.push(`${listing.area_m2} م²`);
  if (listing.rooms != null && listing.rooms > 0) specs.push(`${listing.rooms} خواب`);
  if (specs.length) lines.push(specs.join(' · '));

  if (listing.price) lines.push(`💰 ${formatToman(listing.price)}`);
  if (listing.price_range_min) {
    lines.push(`دامنه منصفانه: ${formatToman(listing.price_range_min)} تا ${formatToman(listing.price_range_max)}`);
  }
  if (listing.price_verdict && VERDICT_LABEL[listing.price_verdict]) {
    lines.push(VERDICT_LABEL[listing.price_verdict]);
  }
  return lines.join('\n');
}

async function sendResultsPage(chatId, districtIdx, roomsCode, page) {
  const all = await fetchResults(districtIdx, roomsCode);
  const start = page * PAGE_SIZE;
  const pageItems = all.slice(start, start + PAGE_SIZE);

  if (pageItems.length === 0) {
    await sendTelegramMessage(chatId, page === 0 ? 'آگهی‌ای با این فیلتر پیدا نشد 😕' : 'آگهی بیشتری وجود ندارد.');
    return;
  }

  for (const listing of pageItems) {
    const caption = listingCaption(listing);
    // Points at melkeeno's own listing page, not the external Divar/kilid
    // URL -- sending users straight to the source would defeat the entire
    // point of having a listing page with price analysis, the neighborhood
    // guide link, and similar listings.
    const reply_markup = {
      inline_keyboard: [[{ text: 'مشاهده در ملکینو ↗', url: `https://khanedade.ir/properties/listing/${listing.token}` }]],
    };
    if (listing.image_url) {
      await sendTelegramPhoto(chatId, listing.image_url, caption, { reply_markup });
    } else {
      await sendTelegramMessage(chatId, caption, { reply_markup });
    }
  }

  if (start + PAGE_SIZE < all.length) {
    await sendTelegramMessage(chatId, `صفحه ${page + 1} از ${Math.ceil(all.length / PAGE_SIZE)}`, {
      reply_markup: {
        inline_keyboard: [[{ text: 'نمایش بیشتر ⬇️', callback_data: `sp:${districtIdx}:${roomsCode}:${page + 1}` }]],
      },
    });
  }

  // Only offered once we actually have a results set to snapshot as
  // "already seen" -- following a search that returned nothing yet would
  // have no baseline to compare future matches against.
  if (all.length > 0) {
    await sendTelegramMessage(chatId, 'می‌خواهید از آگهی‌های جدید همین جستجو باخبر شوید؟', {
      reply_markup: { inline_keyboard: [[{ text: '🔔 دنبال کردن این جستجو', callback_data: `ss:${districtIdx}:${roomsCode}` }]] },
    });
  }
}

async function saveSearch(chatId, districtIdx, roomsCode) {
  const districtLabel = districtIdx === 'x' ? 'همه مناطق' : DISTRICTS[Number(districtIdx)];
  const district = districtIdx === 'x' ? null : districtLabel;
  const rooms = roomsCode === 'x' || roomsCode === '3' ? null : Number(roomsCode);
  const minRooms = roomsCode === '3' ? 3 : null;

  await connectDB();
  const existing = await SavedSearch.findOne({ chatId: String(chatId), district, rooms, minRooms, active: true });
  if (existing) {
    await sendTelegramMessage(chatId, 'این جستجو را قبلاً دنبال می‌کردید ✅');
    return;
  }

  // Snapshot everything currently matching as "already seen" so the first
  // alert only fires for listings that appear *after* following, not a
  // blast of every existing match.
  const current = await fetchResults(districtIdx, roomsCode).catch(() => []);
  await SavedSearch.create({
    chatId: String(chatId),
    district,
    districtLabel,
    rooms,
    minRooms,
    notifiedTokens: current.map((l) => l.token),
  });
  await sendTelegramMessage(
    chatId,
    `دنبال شد ✅ هر وقت آگهی جدیدی در «${districtLabel}» پیدا شد، همینجا خبر می‌دهیم.\nبرای دیدن یا لغو جستجوهای دنبال‌شده، /myalerts را بفرستید.`
  );
}

async function listAlerts(chatId) {
  await connectDB();
  const searches = await SavedSearch.find({ chatId: String(chatId), active: true }).lean();
  if (searches.length === 0) {
    await sendTelegramMessage(chatId, 'هنوز هیچ جستجویی را دنبال نمی‌کنید. برای شروع، /search را بفرستید.');
    return;
  }
  for (const s of searches) {
    const roomsLabel = s.minRooms ? `${s.minRooms}+ خواب` : s.rooms ? `${s.rooms} خواب` : 'هر تعداد خواب';
    await sendTelegramMessage(chatId, `📍 ${s.districtLabel} · ${roomsLabel}`, {
      reply_markup: { inline_keyboard: [[{ text: '❌ لغو این دنبال‌کردن', callback_data: `sx:${s._id}` }]] },
    });
  }
}

async function cancelSearch(chatId, id) {
  await connectDB();
  await SavedSearch.updateOne({ _id: id, chatId: String(chatId) }, { $set: { active: false } });
  await sendTelegramMessage(chatId, 'لغو شد.');
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = (message.text || '').trim();

  if (text === '/start' || text === '/search') {
    await sendTelegramMessage(chatId, 'به ربات ملکینو خوش آمدید 🏠\nبرای جستجوی آگهی، یک منطقه را انتخاب کنید:', {
      reply_markup: districtKeyboard(),
    });
    return;
  }

  if (text === '/myalerts') {
    await listAlerts(chatId);
    return;
  }

  await sendTelegramMessage(chatId, 'برای جستجوی آگهی /search را بفرستید، یا /myalerts را برای مدیریت جستجوهای دنبال‌شده.');
}

async function handleCallback(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data || '';
  await answerCallbackQuery(callbackQuery.id);

  const [action, ...rest] = data.split(':');
  if (action === 'sd') {
    const [districtIdx] = rest;
    await sendTelegramMessage(chatId, 'چند خوابه؟', { reply_markup: roomsKeyboard(districtIdx) });
  } else if (action === 'sp') {
    const [districtIdx, roomsCode, page] = rest;
    await sendResultsPage(chatId, districtIdx, roomsCode, Number(page));
  } else if (action === 'ss') {
    const [districtIdx, roomsCode] = rest;
    await saveSearch(chatId, districtIdx, roomsCode);
  } else if (action === 'sx') {
    const [id] = rest;
    await cancelSearch(chatId, id);
  }
}

export const POST = async (request) => {
  const secretHeader = request.headers.get('x-telegram-bot-api-secret-token');
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }

  let update;
  try {
    update = await request.json();
  } catch {
    return new Response('ok', { status: 200 });
  }

  try {
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallback(update.callback_query);
    }
  } catch (error) {
    console.log('[telegram-webhook]', error.message);
  }

  return new Response('ok', { status: 200 });
};
