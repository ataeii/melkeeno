import { fetchListing } from '@/lib/api';
import ListingDetailClient from './ListingDetailClient';

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
  const property = await fetchListing(params.token).catch(() => null);
  if (!property) {
    return { title: 'آگهی یافت نشد | ملکینو' };
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

  const titleParts = [property.title || `آگهی ${typeLabel}`];
  if (property.district) titleParts.push(property.district);
  const title = `${titleParts.join(' در ')} | ملکینو`;

  const descriptionParts = [`آگهی ${typeLabel}`];
  if (property.area_m2) descriptionParts.push(`${property.area_m2} متر مربع`);
  if (property.rooms) descriptionParts.push(`${property.rooms} خواب`);
  if (property.district) descriptionParts.push(`در ${property.district}`);
  if (priceLabel) descriptionParts.push(priceLabel);
  const description = descriptionParts.join('، ') + ' — مشاهده جزئیات، امکانات و تحلیل قیمت در ملکینو.';

  let image;
  try {
    const images = JSON.parse(property.images || '[]');
    image = images[0] || property.image_url;
  } catch {
    image = property.image_url;
  }

  return {
    title,
    description,
    alternates: { canonical: `/properties/listing/${params.token}` },
    openGraph: {
      title,
      description,
      type: 'website',
      images: image ? [image] : undefined,
    },
  };
}

const DOMAIN = 'https://khanedade.ir';

// Structured data was missing entirely on this page -- the only schema.org
// markup anywhere on the site was on the old, effectively-dead
// /properties/[id] Mongo-backed route. Without it, none of melkeeno's real
// content (the ~2200 listing pages this whole SEO effort was about) can
// ever show up in Google's rich real-estate results. Rendered server-side
// (not from the client component) so it's present in the initial HTML
// crawlers see, not injected after a client fetch.
async function buildJsonLd(token) {
  const property = await fetchListing(token).catch(() => null);
  if (!property) return null;

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

const ListingDetailPage = async ({ params }) => {
  const jsonLd = await buildJsonLd(params.token);
  return (
    <>
      {jsonLd && (
        <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <ListingDetailClient />
    </>
  );
};

export default ListingDetailPage;
