import Link from 'next/link';
import { notFound } from 'next/navigation';
import connectDB from '@/config/database';
import Article from '@/models/Article';
import PropertyCard from '@/components/PropertyCard';
import { findNeighborhoodBySlug, NEIGHBORHOODS } from '@/lib/neighborhoods';

export const dynamic = 'force-dynamic';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DOMAIN = 'https://melkeeno.ir';

async function fetchDistrictListings(dbName) {
  const qs = new URLSearchParams({ district: dbName, sort: 'newest' });
  const res = await fetch(`${API}/api/listings?${qs}`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

async function getGuideExcerpt(guideSlug) {
  if (!guideSlug) return null;
  await connectDB();
  const article = await Article.findOne({ slug: guideSlug, status: 'published' }).select('title excerpt coverEmoji').lean();
  return article || null;
}

function formatPrice(price) {
  if (!price) return null;
  if (price >= 1e9) return (price / 1e9).toFixed(1) + ' میلیارد';
  if (price >= 1e6) return (price / 1e6).toFixed(0) + ' میلیون';
  return price.toLocaleString();
}

export async function generateMetadata({ params }) {
  const neighborhood = findNeighborhoodBySlug(params.slug);
  if (!neighborhood) return { title: 'محله یافت نشد | ملکینو' };

  const listings = await fetchDistrictListings(neighborhood.dbName).catch(() => []);
  const count = listings.length;

  const title = `خرید و اجاره ملک در ${neighborhood.label} | ${count > 0 ? `${count} آگهی` : ''} ملکینو`.replace(
    /\s+\|\s+/g,
    ' | '
  );
  const description =
    count > 0
      ? `${count} آگهی خرید، فروش و اجاره‌ی آپارتمان در ${neighborhood.label}، به‌همراه راهنمای کامل محله، قیمت‌ها و امکانات — در ملکینو.`
      : `راهنمای کامل محله‌ی ${neighborhood.label}: امکانات، دسترسی و بازار مسکن — به‌همراه آگهی‌های خرید و اجاره‌ی ملک در ملکینو.`;

  return {
    title,
    description,
    alternates: { canonical: `/properties/district/${neighborhood.slug}` },
    openGraph: { title, description, type: 'website' },
  };
}

const DistrictPage = async ({ params }) => {
  const neighborhood = findNeighborhoodBySlug(params.slug);
  if (!neighborhood) notFound();

  const [listings, guide] = await Promise.all([
    fetchDistrictListings(neighborhood.dbName).catch(() => []),
    getGuideExcerpt(neighborhood.guideSlug),
  ]);

  const buyListings = listings.filter((l) => l.listing_type === 'buy' && l.price);
  const rentListings = listings.filter((l) => l.listing_type === 'rent' && l.rent);
  const avgBuyPpm2 =
    buyListings.filter((l) => l.area_m2).length > 0
      ? Math.round(
          buyListings.filter((l) => l.area_m2).reduce((sum, l) => sum + l.price / l.area_m2, 0) /
            buyListings.filter((l) => l.area_m2).length
        )
      : null;
  const avgRent =
    rentListings.length > 0 ? Math.round(rentListings.reduce((sum, l) => sum + l.rent, 0) / rentListings.length) : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ملکینو', item: DOMAIN },
      { '@type': 'ListItem', position: 2, name: 'املاک', item: `${DOMAIN}/properties` },
      { '@type': 'ListItem', position: 3, name: neighborhood.label, item: `${DOMAIN}/properties/district/${neighborhood.slug}` },
    ],
  };

  return (
    <section dir='rtl' className='max-w-6xl mx-auto px-4 py-8'>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href='/properties' className='text-blue-600 text-sm font-semibold mb-4 inline-block'>
        ← بازگشت به همه‌ی املاک
      </Link>

      <h1 className='text-2xl font-extrabold text-gray-800 mb-2'>خرید و اجاره ملک در {neighborhood.label}</h1>

      <div className='flex flex-wrap gap-3 mb-6 text-sm'>
        <span className='bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-semibold'>{listings.length} آگهی فعال</span>
        {avgBuyPpm2 && (
          <span className='bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full'>
            میانگین قیمت خرید: {formatPrice(avgBuyPpm2)} تومان/متر
          </span>
        )}
        {avgRent && (
          <span className='bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full'>
            میانگین اجاره: {formatPrice(avgRent)} تومان/ماه
          </span>
        )}
      </div>

      {guide && (
        <Link
          href={`/articles/${neighborhood.guideSlug}`}
          className='block bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-100 rounded-xl p-4 mb-8'
        >
          <p className='font-bold text-amber-900 mb-1'>
            {guide.coverEmoji || '📖'} {guide.title}
          </p>
          <p className='text-amber-800 text-sm'>{guide.excerpt}</p>
          <p className='text-amber-700 text-xs mt-2'>مطالعه‌ی راهنمای کامل محله ←</p>
        </Link>
      )}

      {listings.length > 0 ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {listings.slice(0, 24).map((item) => (
            <PropertyCard key={item.token} property={item} />
          ))}
        </div>
      ) : (
        <p className='text-gray-400 text-sm bg-white rounded-xl border border-gray-100 p-6 text-center'>
          در حال حاضر آگهی فعالی برای {neighborhood.label} ثبت نشده — به‌زودی بررسی می‌شود.
        </p>
      )}

      <div className='mt-10 pt-6 border-t border-gray-100'>
        <p className='text-sm font-bold text-gray-700 mb-3'>محله‌های دیگر</p>
        <div className='flex flex-wrap gap-2'>
          {NEIGHBORHOODS.filter((n) => n.slug !== neighborhood.slug).map((n) => (
            <Link
              key={n.slug}
              href={`/properties/district/${n.slug}`}
              className='text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full transition-colors'
            >
              {n.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DistrictPage;
