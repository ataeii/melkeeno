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

export async function matchListings({ work, schools, listingType }) {
  const res = await fetch(`${API}/api/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      work,
      schools,
      listing_type: listingType || null,
    }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch match results');
  return res.json();
}

export async function matchCustomHouse({ house, work, schools }) {
  const res = await fetch(`${API}/api/match/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ house, work, schools }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch custom house route info');
  return res.json();
}

export async function searchSchools(query) {
  const qs = new URLSearchParams({ query, limit: '8' });
  const res = await fetch(`${API}/api/schools?${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to search schools');
  return res.json();
}

export async function nearbySchools({ lat, lng }) {
  const qs = new URLSearchParams({ lat, lng, limit: '3' });
  const res = await fetch(`${API}/api/schools/nearby?${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch nearby schools');
  return res.json();
}
