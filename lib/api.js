const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchListings(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString();
  const res = await fetch(`${API}/api/listings${qs ? '?' + qs : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch listings');
  return res.json();
}

export async function fetchMeta() {
  const res = await fetch(`${API}/api/meta`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch meta');
  return res.json();
}
