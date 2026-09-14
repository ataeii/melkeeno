const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchListings(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString();
  const res = await fetch(`${API}/api/listings${qs ? '?' + qs : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch listings');
  return res.json();
}

export async function fetchListing(token) {
  const res = await fetch(`${API}/api/listings/${token}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch listing');
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

export async function fetchAllSchools() {
  const res = await fetch(`${API}/api/schools?limit=500`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch schools');
  return res.json();
}

export async function submitPendingSchool(school) {
  const res = await fetch(`${API}/api/schools/pending`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(school),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to submit school');
  return res.json();
}

export async function nearbySchools({ lat, lng, limit = 10 }) {
  const qs = new URLSearchParams({ lat, lng, limit: String(limit) });
  const res = await fetch(`${API}/api/schools/nearby?${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch nearby schools');
  return res.json();
}

export async function nearbyServices({ lat, lng }) {
  const qs = new URLSearchParams({ lat, lng });
  const res = await fetch(`${API}/api/nearby-services?${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch nearby services');
  return res.json();
}

export async function nearbyPoi({ lat, lng, categories }) {
  const qs = new URLSearchParams({ lat, lng, categories: categories.join(',') });
  const res = await fetch(`${API}/api/nearby-poi?${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch nearby points of interest');
  return res.json();
}

export async function fetchPoiList(category) {
  const res = await fetch(`${API}/api/poi-list?category=${category}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch place list');
  return res.json();
}

export async function fetchOffices() {
  // Merged directory: scraped Kilid offices + approved user-registered ones
  // -- served by the Next.js app itself, not the scraper API directly.
  const res = await fetch(`/api/offices`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch offices');
  return res.json();
}

export async function fetchAirQuality() {
  const res = await fetch(`${API}/api/air-quality`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch air quality');
  return res.json();
}
