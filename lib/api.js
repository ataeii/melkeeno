const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// `init` lets server components opt into caching (e.g. { next: { revalidate } });
// the default stays no-store for the interactive client-side callers.
export async function fetchListings(params = {}, init = { cache: 'no-store' }) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString();
  const res = await fetch(`${API}/api/listings${qs ? '?' + qs : ''}`, init);
  if (!res.ok) throw new Error('Failed to fetch listings');
  return res.json();
}

const toQuery = (params) =>
  new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString();

// One page of listings + the total number of matches (X-Total-Count header).
// Replaces fetching every listing at once: /api/listings capped at 2000 rows
// per type and returned multi-MB responses once the data grew past ~4,600.
export async function fetchListingsPage(params = {}, init = { cache: 'no-store' }) {
  const qs = toQuery(params);
  const res = await fetch(`${API}/api/listings-page${qs ? '?' + qs : ''}`, init);
  if (!res.ok) throw new Error('Failed to fetch listings page');
  const items = await res.json();
  const total = Number(res.headers.get('x-total-count'));
  return { items: Array.isArray(items) ? items : [], total: Number.isFinite(total) ? total : items.length };
}

// Every matching listing as a minimal map point (token, lat, lng, type, price, rent).
export async function fetchListingPoints(params = {}) {
  const qs = toQuery(params);
  const res = await fetch(`${API}/api/listings-points${qs ? '?' + qs : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch listing points');
  const points = await res.json();
  return Array.isArray(points) ? points : [];
}

// Building-materials comparison (Torob-style): items with offers from several sellers.
export async function fetchMaterialsSummary(init = { next: { revalidate: 600 } }) {
  const res = await fetch(`${API}/api/materials-summary`, init);
  if (!res.ok) throw new Error('Failed to fetch materials summary');
  return res.json();
}

export async function fetchMaterialItems(category, params = {}, init = { next: { revalidate: 600 } }) {
  const qs = toQuery(params);
  const res = await fetch(`${API}/api/materials/${category}${qs ? '?' + qs : ''}`, init);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch material items');
  return res.json();
}

export async function fetchMaterialItem(category, key, init = { next: { revalidate: 600 } }) {
  const res = await fetch(`${API}/api/materials/${category}/${encodeURIComponent(key)}`, init);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch material item');
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
  const res = await fetch(`${API}/api/schools?limit=10000`, { cache: 'no-store' });
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

// Surroundings of a place (vicinity name, local prices, nearby listings /
// metro / park / schools / hospitals / libraries) for the per-place pages.
// Cached for an hour -- it changes only when listings are re-scraped.
export async function fetchPlaceContext({ lat, lng, excludeKind, excludeId }) {
  const qs = new URLSearchParams({ lat, lng });
  if (excludeKind) qs.set('exclude_kind', excludeKind);
  if (excludeId != null) qs.set('exclude_id', excludeId);
  const res = await fetch(`${API}/api/place-context?${qs}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch place context');
  return res.json();
}

// Neighborhoods with enough rent listings for a «اجاره آپارتمان در …» page,
// with medians (backend applies the minimum-listings threshold).
export async function fetchRentDistricts() {
  const res = await fetch(`${API}/api/rent-districts`, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error('Failed to fetch rent districts');
  return res.json();
}

export async function fetchRentListings(district) {
  const qs = new URLSearchParams({ listing_type: 'rent', district, sort: 'price_asc' });
  const res = await fetch(`${API}/api/listings?${qs}`, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error('Failed to fetch rent listings');
  return res.json();
}
