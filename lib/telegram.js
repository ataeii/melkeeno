import { callRelay } from './relay';

// Server-only helper. Telegram's API is unreachable directly from the
// production server (api.telegram.org resolves to a private/black-holed IP
// there -- Iran's own domestic censorship, not a Google-style geo-block), so
// every outbound call goes through the shared relay. Inbound webhooks are
// unaffected by this and don't use this file at all.
async function callTelegram(method, payload) {
  const res = await callRelay('telegram', { method, payload });
  return res.json();
}

export async function sendTelegramMessage(chatId, text, extra = {}) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra,
  });
}

export async function sendTelegramPhoto(chatId, photoUrl, caption, extra = {}) {
  return callTelegram('sendPhoto', {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: 'HTML',
    ...extra,
  });
}

export async function answerCallbackQuery(callbackQueryId, extra = {}) {
  return callTelegram('answerCallbackQuery', { callback_query_id: callbackQueryId, ...extra });
}

// Best-effort admin notification -- never throws, so a Telegram/relay hiccup
// never breaks the site action (new listing, new lead) that triggered it.
export async function notifyAdmin(text) {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChatId) return;
  try {
    await sendTelegramMessage(adminChatId, text);
  } catch (error) {
    console.log('[telegram] admin notify failed:', error.message);
  }
}
