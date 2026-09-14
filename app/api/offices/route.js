import connectDB from '@/config/database';
import Office from '@/models/Office';

export const dynamic = 'force-dynamic';

const SCRAPER_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// GET -- merges scraped Kilid offices (SQLite, via the FastAPI backend)
// with approved user-registered offices (MongoDB) into one directory shape
// for the public /offices page.
export const GET = async () => {
  const [scraped, registered] = await Promise.all([
    fetch(`${SCRAPER_API}/api/offices`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => []),
    (async () => {
      await connectDB();
      return Office.find({ status: 'approved' }).lean();
    })(),
  ]);

  const scrapedNormalized = scraped.map((o) => ({
    id: `scraped-${o.id}`,
    source: 'scraped',
    name: o.name,
    address: o.address,
    phone: o.phone,
    lat: o.lat,
    lng: o.lng,
    url: o.url,
  }));

  const registeredNormalized = registered.map((o) => ({
    id: `registered-${o._id}`,
    source: 'registered',
    name: o.name,
    address: o.address,
    phone: o.phone,
    lat: o.lat,
    lng: o.lng,
    description: o.description,
    workingHours: o.workingHours,
    specialties: o.specialties,
    logoUrl: o.logoUrl,
  }));

  return Response.json([...registeredNormalized, ...scrapedNormalized]);
};
