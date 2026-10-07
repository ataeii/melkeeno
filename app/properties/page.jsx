import PropertiesClient from './PropertiesClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Rebuilt at most every 5 minutes instead of per request -- the default
// (unfiltered) list is the same for every visitor.
export const revalidate = 300;

// This page used to be entirely client-rendered, so crawlers got an empty
// list ("در حال بارگذاری...") with no listing links. The first page of the
// default view is now fetched here and rendered into the initial HTML; the
// client then loads map points and further pages from the paginated API.
const INITIAL_PAGE = 30;

async function getInitialData() {
  const [first, meta] = await Promise.all([
    fetch(`${API}/api/listings-page?listing_type=buy&sort=price_asc&limit=${INITIAL_PAGE}`, { next: { revalidate } })
      .then(async (r) => (r.ok ? { items: await r.json(), total: Number(r.headers.get('x-total-count')) } : null))
      .catch(() => null),
    fetch(`${API}/api/meta`, { next: { revalidate } })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({})),
  ]);
  const items = Array.isArray(first?.items) ? first.items : [];
  return {
    listings: items,
    total: Number.isFinite(first?.total) ? first.total : items.length,
    districts: meta?.districts || [],
  };
}

const PropertiesPage = async () => {
  const { listings, total, districts } = await getInitialData();
  return <PropertiesClient initialListings={listings} initialTotal={total} initialDistricts={districts} />;
};

export default PropertiesPage;
