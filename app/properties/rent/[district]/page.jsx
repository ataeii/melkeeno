import Link from 'next/link';
import { notFound } from 'next/navigation';
import PropertyCard from '@/components/PropertyCard';
import PlaceContext from '@/components/PlaceContext';
import { fetchPlaceContext, fetchRentDistricts, fetchRentListings } from '@/lib/api';
import { findNeighborhood } from '@/lib/neighborhoods';
import { pageMeta } from '@/lib/seo';
import { formatToman, toFa } from '@/lib/place';
import { decodeDistrict, realRent, rentPagePath } from '@/lib/rentPages';

export const revalidate = 900;

const DOMAIN = 'https://khanedade.ir';

const median = (values) => {
  const v = values.filter(Boolean).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};

// One page per neighborhood with enough live rent listings: matches searches
// like «اجاره آپارتمان در پاسداران» / «اجاره خانه در پاسداران تهران». Only
// neighborhoods the backend lists (>= its minimum count) get a page; any
// other name 404s rather than publishing a thin page.
async function load(params) {
  const district = decodeDistrict(params.district);
  const districts = await fetchRentDistricts().catch(() => []);
  const summary = districts.find((d) => d.district === district);
  if (!summary) return null;
  const listings = await fetchRentListings(district).catch(() => []);
  if (!listings.length) return null;

  const withCoords = listings.filter((l) => l.lat && l.lng);
  const context = withCoords.length
    ? await fetchPlaceContext({
        lat: median(withCoords.map((l) => l.lat)),
        lng: median(withCoords.map((l) => l.lng)),
      }).catch(() => null)
    : null;

  const fullDeposit = listings.filter((l) => !realRent(l.rent) && l.deposit).length;
  const rooms = median(listings.map((l) => l.rooms));
  return { district, summary, listings, context, fullDeposit, rooms, others: districts };
}

export async function generateMetadata({ params }) {
  const data = await load(params);
  if (!data) return { title: 'آگهی اجاره‌ای در این محله یافت نشد | خانه‌داده', robots: { index: false } };
  const { district, summary } = data;
  const bits = [
    `${toFa(summary.count)} آگهی رهن و اجاره‌ی آپارتمان در ${district} تهران`,
    summary.median_deposit ? `ودیعه‌ی میانه ${formatToman(summary.median_deposit)}` : null,
    summary.median_rent ? `اجاره‌ی میانه ${formatToman(summary.median_rent)}` : null,
  ].filter(Boolean);
  return pageMeta({
    title: `اجاره آپارتمان در ${district} تهران — رهن و اجاره، ${toFa(summary.count)} آگهی | خانه‌داده`,
    description: `${bits.join('، ')} — با تحلیل قیمت منصفانه‌ی هر آگهی و امکانات محله، در خانه‌داده.`,
    path: rentPagePath(district),
  });
}

const RentDistrictPage = async ({ params }) => {
  const data = await load(params);
  if (!data) notFound();
  const { district, summary, listings, context, fullDeposit, rooms, others } = data;
  const guide = findNeighborhood(district);

  const intro = [
    `در حال حاضر ${toFa(summary.count)} آگهی رهن و اجاره‌ی آپارتمان در ${district} در خانه‌داده فعال است.`,
    [
      summary.median_deposit ? `میانه‌ی ودیعه در این آگهی‌ها حدود ${formatToman(summary.median_deposit)}` : null,
      summary.median_rent ? `میانه‌ی اجاره‌ی ماهانه حدود ${formatToman(summary.median_rent)}` : null,
    ]
      .filter(Boolean)
      .join(' و ')
      .replace(/^(.+)$/, '$1 است.') || null,
    summary.median_area ? `متراژ رایج آپارتمان‌ها حدود ${toFa(summary.median_area)} متر${rooms ? ` با ${toFa(rooms)} خواب` : ''} است.` : null,
    fullDeposit ? `${toFa(fullDeposit)} آگهی به‌صورت رهن کامل (بدون اجاره‌ی ماهانه) عرضه شده‌اند.` : null,
    'برای هر آگهی، تحلیل قیمت منصفانه (مقایسه با آگهی‌های مشابه، با در نظر گرفتن متراژ و سن بنا) را هم می‌بینید.',
  ].filter(Boolean);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `اجاره آپارتمان در ${district}`,
    numberOfItems: listings.length,
    itemListElement: listings.slice(0, 30).map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${DOMAIN}/properties/listing/${l.token}`,
      name: l.title,
    })),
  };

  return (
    <section dir='rtl' className='max-w-6xl mx-auto px-4 py-8'>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href='/properties/rent' className='text-blue-600 text-sm font-semibold mb-4 inline-block'>
        → اجاره آپارتمان در محله‌های دیگر تهران
      </Link>
      <h1 className='text-2xl font-extrabold text-gray-800 mb-3'>اجاره آپارتمان در {district}</h1>
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 text-sm text-gray-700 leading-7'>
        {intro.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
        {guide && (
          <Link
            href={`/properties/district/${guide.slug}`}
            className='inline-block mt-2 text-blue-700 font-semibold hover:underline'
          >
            راهنمای محله‌ی {guide.label}: تاریخچه، امکانات و بازار خرید ←
          </Link>
        )}
      </div>

      <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
        {listings.map((l) => (
          <PropertyCard key={l.token} property={l} />
        ))}
      </div>

      {context && (
        <div className='max-w-3xl mb-8'>
          <PlaceContext context={context} placeLabel={district} only={['nearby']} />
        </div>
      )}

      <div className='border-t border-gray-100 pt-6'>
        <h2 className='font-bold text-gray-800 mb-3 text-sm'>اجاره آپارتمان در محله‌های دیگر</h2>
        <div className='flex flex-wrap gap-2'>
          {others
            .filter((d) => d.district !== district)
            .map((d) => (
              <Link
                key={d.district}
                href={rentPagePath(d.district)}
                className='text-xs bg-gray-100 hover:bg-blue-50 text-gray-700 px-3 py-1.5 rounded-full'
              >
                {d.district} ({toFa(d.count)})
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
};

export default RentDistrictPage;
