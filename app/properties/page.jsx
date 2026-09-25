import PropertiesClient from './PropertiesClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Rebuilt at most every 5 minutes instead of per request -- the default
// (unfiltered) list is the same for every visitor.
export const revalidate = 300;

// This page used to be entirely client-rendered, so crawlers got an empty
// list ("در حال بارگذاری...") with no listing links. The first page of the
// default view is now fetched here and rendered into the initial HTML; the
// client still loads the full set afterwards for the map and filters.
async function getInitialData() {
  const [listings, meta] = await Promise.all([
    fetch(`${API}/api/listings?listing_type=buy&sort=price_asc`, { next: { revalidate } })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    fetch(`${API}/api/meta`, { next: { revalidate } })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({})),
  ]);
  return {
    // Only the first page goes into the HTML/RSC payload -- the full list
    // is several MB of enriched rows.
    listings: Array.isArray(listings) ? listings.slice(0, 60) : [],
    districts: meta?.districts || [],
  };
}

const PropertiesPage = async () => {
  const { listings, districts } = await getInitialData();
  return <PropertiesClient initialListings={listings} initialDistricts={districts} />;
};

export default PropertiesPage;
