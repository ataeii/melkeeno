// Shared helper for the single Cloudflare Worker relay this project uses to
// reach APIs that are unreachable directly from the Iranian production
// server -- Gemini (Google geo-blocks the server's IP) and Telegram
// (Iran's own domestic censorship DNS-poisons api.telegram.org). Each
// caller passes a `service` name the Worker dispatches on.
export async function callRelay(service, payload) {
  const relayUrl = process.env.RELAY_URL;
  if (!relayUrl) {
    throw new Error(`RELAY_URL is not configured (required to reach "${service}" from this server)`);
  }

  const res = await fetch(relayUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-relay-secret': process.env.RELAY_SECRET,
    },
    body: JSON.stringify({ service, ...payload }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Relay request failed for "${service}": ${res.status} ${body}`);
  }

  return res;
}
