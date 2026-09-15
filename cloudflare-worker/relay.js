// Deployed to Cloudflare Workers (not part of the Next.js build) -- a single
// outbound relay for anything melkeeno.ir's Iranian server can't reach
// directly: Gemini (Google geo-blocks the server's IP) and Telegram (Iran's
// own censorship DNS-poisons api.telegram.org). Kept here for reference and
// version history; the source of truth is whatever is pasted into the
// Cloudflare dashboard.
export default {
  async fetch(request, env) {
    // Inbound direction: Telegram calling US (webhook updates), not us
    // calling Telegram. Added 2026-09-12 after discovering the same
    // Iran-censorship block that forces the outbound relay below also
    // applies in reverse -- Telegram's servers got "Connection refused"
    // trying to reach melkeeno.ir directly (confirmed via getWebhookInfo),
    // even though ordinary browser/bot traffic to that same IP works fine.
    // Telegram's webhook is registered to this path instead of directly to
    // melkeeno.ir, and this just forwards the raw update through -- no
    // x-relay-secret involved since Telegram doesn't send that header;
    // Telegram's own optional secret_token (if set via setWebhook) is
    // instead passed through as-is for the app route to verify.
    const url = new URL(request.url);
    if (url.pathname === '/telegram-webhook') {
      return forwardIncomingTelegramWebhook(request);
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const secret = request.headers.get('x-relay-secret');
    if (!secret || secret !== env.RELAY_SECRET) {
      return new Response('Forbidden', { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    if (body.service === 'gemini') {
      return forwardGemini(body, env);
    }
    if (body.service === 'telegram') {
      return forwardTelegram(body, env);
    }
    return new Response('Unknown service', { status: 400 });
  },
};

async function forwardIncomingTelegramWebhook(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const headers = { 'Content-Type': 'application/json' };
  const tgSecret = request.headers.get('x-telegram-bot-api-secret-token');
  if (tgSecret) headers['x-telegram-bot-api-secret-token'] = tgSecret;

  const body = await request.text();
  const upstream = await fetch('https://khanedade.ir/api/telegram/webhook', {
    method: 'POST',
    headers,
    body,
  });
  // Telegram only cares about the HTTP status, not the body -- but pass it
  // through anyway, harmless and useful for manual debugging.
  return new Response(await upstream.text(), { status: upstream.status });
}

async function forwardGemini({ prompt, model }, env) {
  if (!prompt || typeof prompt !== 'string') {
    return new Response('Missing prompt', { status: 400 });
  }
  const geminiModel = model || 'gemini-2.5-flash';
  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6 },
      }),
    }
  );
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
}

async function forwardTelegram({ method, payload }, env) {
  if (!method || typeof method !== 'string') {
    return new Response('Missing method', { status: 400 });
  }
  const upstream = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
}
