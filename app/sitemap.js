import Article from '@/models/Article';
import connectDB from '@/config/database';
import { NEIGHBORHOODS } from '@/lib/neighborhoods';

export const dynamic = 'force-dynamic';

const DOMAIN = 'https://melkeeno.ir';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Kept in sync with app/materials/page.jsx's CATEGORY_ORDER -- these pages
// existed but were never added to the sitemap, so Google never had a
// direct path to them beyond whatever internal links happened to reach them.
const MATERIAL_CATEGORIES = ['cement', 'rebar', 'brick', 'block', 'gypsum'];

// The 9 non-school categories /places/[category] actually serves -- schools
// have their own /schools/[id] route instead, see NearbyPlacesPanel's
// placeLink(). Kept in sync with /places/page.jsx's CATEGORIES list.
const PLACE_CATEGORIES = [
  'hospital',
  'chain_store',
  'library',
  'park',
  'cafe',
  'pharmacy',
  'bank',
  'metro',
  'gym',
];

const STATIC_ROUTES = ['/properties', '/places', '/schools', '/family-finder', '/offices', '/materials', '/finance'];

export default async function sitemap() {
  await connectDB();
  const articles = await Article.find({ status: 'published' }).select('slug updatedAt');

  // Previously this pulled from the legacy MongoDB `Property` model, which
  // has been empty since the site moved to the scraped-listings backend --
  // meaning zero actual property pages were ever submitted to Google. This
  // hits the new lightweight /api/listings-sitemap endpoint instead, which
  // enumerates every published listing (no per-type/2000-row cap like the
  // regular /api/listings endpoint has).
  let listingUrls = [];
  try {
    const res = await fetch(`${API}/api/listings-sitemap`, { cache: 'no-store' });
    if (res.ok) {
      const listings = await res.json();
      listingUrls = listings.map((l) => ({
        url: `${DOMAIN}/properties/listing/${l.token}`,
        lastModified: l.scraped_at ? new Date(l.scraped_at) : new Date(),
      }));
    }
  } catch {
    // Sitemap generation shouldn't fail outright just because the scraper
    // API is briefly unreachable -- fall back to the static/article URLs.
  }

  const articleUrls = articles.map((article) => ({
    url: `${DOMAIN}/articles/${article.slug}`,
    lastModified: article.updatedAt,
  }));

  const staticUrls = STATIC_ROUTES.map((route) => ({
    url: `${DOMAIN}${route}`,
    lastModified: new Date(),
  }));

  const placeCategoryUrls = PLACE_CATEGORIES.map((key) => ({
    url: `${DOMAIN}/places/${key}`,
    lastModified: new Date(),
  }));

  const materialCategoryUrls = MATERIAL_CATEGORIES.map((key) => ({
    url: `${DOMAIN}/materials/${key}`,
    lastModified: new Date(),
  }));

  const districtUrls = NEIGHBORHOODS.map((n) => ({
    url: `${DOMAIN}/properties/district/${n.slug}`,
    lastModified: new Date(),
  }));

  return [
    { url: DOMAIN, lastModified: new Date() },
    { url: `${DOMAIN}/articles`, lastModified: new Date() },
    ...staticUrls,
    ...placeCategoryUrls,
    ...materialCategoryUrls,
    ...districtUrls,
    ...articleUrls,
    ...listingUrls,
  ];
}
