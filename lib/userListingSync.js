import Office from '@/models/Office';

const SCRAPER_URL = process.env.SCRAPER_INTERNAL_URL || 'http://127.0.0.1:8000';

// Advertiser type comes from the account, never from what the poster claims:
// "office" only for a poster with an admin-approved Office; everyone else is "owner".
export async function advertiserFor(userId) {
  const office = await Office.findOne({ userId, status: 'approved' }).select('name');
  return office
    ? { type: 'office', name: office.name, ref: String(office._id) }
    : { type: 'owner', name: null, ref: null };
}

// Pushes (or retires) one UserListing in the scraper's listings table.
export async function syncUserListing(listing, state) {
  const adv = await advertiserFor(listing.userId);
  const body = {
    id: String(listing._id),
    state,
    listing_type: listing.listingType,
    district: listing.district || null,
    lat: listing.lat ?? null,
    lng: listing.lng ?? null,
    title: listing.title,
    description: listing.description || null,
    price: listing.price ?? null,
    rent: listing.rent ?? null,
    deposit: listing.deposit ?? null,
    area_m2: listing.areaM2 ?? null,
    rooms: listing.rooms ?? null,
    floor: listing.floor ?? null,
    total_floors: listing.totalFloors ?? null,
    year_built: listing.yearBuilt ?? null,
    has_parking: listing.hasParking ?? null,
    has_elevator: listing.hasElevator ?? null,
    has_warehouse: listing.hasWarehouse ?? null,
    has_balcony: listing.hasBalcony ?? null,
    advertiser_type: adv.type,
    advertiser_name: adv.name,
    advertiser_ref: adv.ref,
    contact_phone: listing.phone,
  };
  const res = await fetch(`${SCRAPER_URL}/api/internal/user-listing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.USER_LISTING_SECRET || '' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`scraper sync failed: ${res.status}`);
}
