import { sendTelegramMessage, sendTelegramPhoto, answerCallbackQuery } from '@/lib/telegram';
import { fetchListings } from '@/lib/api';

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
    const reply_markup = listing.url
      ? { inline_keyboard: [[{ text: 'مشاهده در دیوار ↗', url: listing.url }]] }
      : undefined;
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

  await sendTelegramMessage(chatId, 'برای جستجوی آگهی /search را بفرستید.');
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
