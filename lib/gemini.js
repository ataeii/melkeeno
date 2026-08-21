import { callRelay } from './relay';

// Server-only helper — never import this from a client component, it reads
// GEMINI_API_KEY directly. Calls the plain REST endpoint rather than pulling
// in the SDK, matching the fetch-based pattern already used for sms.ir.
//
// Google geo-blocks Gemini requests from the production server's Iranian IP
// (confirmed: a Google-edge 403 page, not an API error). When RELAY_URL is
// set, requests go through a small Cloudflare Worker relay instead, which
// forwards to Gemini from non-blocked infrastructure. Local dev has no such
// block, so it keeps calling Google directly when the relay isn't configured.
export async function generateFinanceNarrative(prompt) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const res = process.env.RELAY_URL
    ? await callRelay('gemini', { prompt, model })
    : await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.6 },
          }),
        }
      );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini request failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) {
    throw new Error('Gemini returned no text (possibly blocked by safety filters)');
  }
  return text;
}
