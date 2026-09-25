import { notFound } from 'next/navigation';
import { fetchListing, fetchListings } from '@/lib/api';
import ListingDetailClient from './ListingDetailClient';
import { pageMeta } from '@/lib/seo';

function formatPrice(price) {
  if (!price || price === 0) return null;
  if (price >= 1e9) return (price / 1e9).toFixed(1) + ' میلیارد';
  if (price >= 1e6) return (price / 1e6).toFixed(0) + ' میلیون';
  return price.toLocaleString();
}

// Was missing entirely -- this page was a client component with no
// generateMetadata, so every one of the ~2200 listing pages served the
// exact same generic site-wide title/description to Google regardless of
// which property, district, or price it actually was.
export async function generateMetadata({ params }) {
  // undefined = backend error (keep the page, client retries); null = the
  // backend said 404. notFound() has to fire here, not in the page body:
  // app/loading.jsx makes the page stream, so by the time the body runs a
  // 200 has already been sent and the "404" is only a noindex soft 404.
  const property = await fetchListing(params.token).catch(() => undefined);
  if (property === null) notFound();
  if (!property) {
    return { title: 'آگهی | خانه‌داده' };
  }

  const typeLabel =
    property.listing_type === 'short_term' ? 'اجاره کوتاه‌مدت' : property.listing_type === 'rent' ? 'اجاره' : 'فروش';
  const priceLabel =
    property.listing_type === 'rent'
      ? property.rent
        ? formatPrice(property.rent) + ' تومان در ماه'
        : null
      : property.price
      ? formatPrice(property.price) + ' تومان'
      : null;

  // A few dozen kilid listings carry a raw English slug ("oghaf",
  // "shahrak-ati-shahr") as their district -- leave those out of the
  // Persian title/snippet rather than print the slug.
  const district = property.district && !/^[A-Za-z0-9 _-]+$/.test(property.district) ? property.district : null;

  const titleParts = [property.title || `آگهی ${typeLabel}`];
  if (district) titleParts.push(district);
  const title = `${titleParts.join(' در ')} | خانه‌داده`;

  const descriptionParts = [`آگهی ${typeLabel}`];
  if (property.area_m2) descriptionParts.push(`${property.area_m2} متر مربع`);
  if (property.rooms) descriptionParts.push(`${property.rooms} خواب`);
  if (district) descriptionParts.push(`در ${district}`);
  if (priceLabel) descriptionParts.push(priceLabel);
  const description = descriptionParts.join('، ') + ' — مشاهده جزئیات، امکانات و تحلیل قیمت در خانه‌داده.';

  let image;
  try {
    const images = JSON.parse(property.images || '[]');
    image = images[0] || property.image_url;
  } catch {
    image = property.image_url;
  }

  return pageMeta({
    title,
    description,
    path: `/properties/listing/${params.token}`,
    images: image ? [image] : undefined,
  });
}

const DOMAIN = 'https://khanedade.ir';

// Structured data was missing entirely on this page -- the only schema.org
// markup anywhere on the site was on the old, effectively-dead
// /properties/[id] Mongo-backed route. Without it, none of melkeeno's real
// content (the ~2200 listing pages this whole SEO effort was about) can
// ever show up in Google's rich real-estate results. Rendered server-side
// (not from the client component) so it's present in the initial HTML
// crawlers see, not injected after a client fetch.
function buildJsonLd(token, property) {

  let images = [];
  try {
    images = JSON.parse(property.images || '[]');
  } catch {
    images = [];
  }
  if (images.length === 0 && property.image_url) images = [property.image_url];

  const amount = property.listing_type === 'rent' ? property.rent : property.price;

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title || 'آگهی ملک',
    description: property.description || undefined,
    url: `${DOMAIN}/properties/listing/${token}`,
    image: images.length ? images : undefined,
    datePosted: property.published_at || property.scraped_at || undefined,
    address: property.district
      ? { '@type': 'PostalAddress', addressLocality: property.district, addressRegion: 'تهران', addressCountry: 'IR' }
      : undefined,
    floorSize: property.area_m2 ? { '@type': 'QuantitativeValue', value: property.area_m2, unitCode: 'MTK' } : undefined,
    numberOfRooms: property.rooms || undefined,
    offers: amount
      ? {
          '@type': 'Offer',
          price: amount,
          priceCurrency: 'IRR',
          availability: 'https://schema.org/InStock',
          businessFunction: property.listing_type === 'rent' ? 'https://schema.org/LeaseOut' : 'https://schema.org/Sell',
        }
      : undefined,
  };
}

// The listing (and its similar-listings strip) used to be fetched only in
// the browser, so the HTML crawlers received was just "در حال بارگذاری..."
// -- no text, no internal links. Fetch on the server and hand the data to
// the client component so the full page is in the initial HTML.
const ListingDetailPage = async ({ params }) => {
  let property;
  try {
    property = await fetchListing(params.token);
  } catch {
    // Backend hiccup: fall back to the client-side fetch rather than 404.
    property = undefined;
  }
  // A genuinely missing/expired listing now returns a real 404 instead of
  // a 200 "not found" page (a soft 404 to Google).
  if (property === null) notFound();

  let similar = [];
  if (property?.district && property?.listing_type) {
    similar = await fetchListings({ district: property.district, listing_type: property.listing_type })
      .then((rows) => rows.filter((r) => r.token !== params.token).slice(0, 4))
      .catch(() => []);
  }

  const jsonLd = property ? buildJsonLd(params.token, property) : null;
  return (
    <>
      {jsonLd && (
        <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <ListingDetailClient initialProperty={property} initialSimilar={similar} />
    </>
  );
};

export default ListingDetailPage;
