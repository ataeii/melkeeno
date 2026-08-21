// Deployed to Cloudflare Workers (not part of the Next.js build) -- a single
// outbound relay for anything melkeeno.ir's Iranian server can't reach
// directly: Gemini (Google geo-blocks the server's IP) and Telegram (Iran's
// own censorship DNS-poisons api.telegram.org). Kept here for reference and
// version history; the source of truth is whatever is pasted into the
// Cloudflare dashboard.
export default {
  async fetch(request, env) {
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
