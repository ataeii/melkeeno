import PlacesCategoryClient from './PlacesCategoryClient';

// Was a client component with zero generateMetadata -- every one of these
// 9 category pages served the exact same generic site-wide title/description
// to Google regardless of which category it was, same root cause already
// fixed for listing/district pages (see app/properties/listing/[token]/page.jsx).
const CATEGORY_LABELS = {
  hospital: 'بیمارستان‌ها',
  chain_store: 'فروشگاه‌های زنجیره‌ای',
  library: 'کتابخانه‌ها',
  park: 'پارک‌ها',
  cafe: 'کافه‌ها',
  pharmacy: 'داروخانه‌ها',
  bank: 'بانک‌ها',
  metro: 'ایستگاه‌های مترو',
  gym: 'باشگاه‌های ورزشی',
};

export async function generateMetadata({ params }) {
  const label = CATEGORY_LABELS[params.category];
  if (!label) return { title: 'دسته‌بندی یافت نشد | خانه‌داده' };

  const title = `${label} تهران روی نقشه | خانه‌داده`;
  const description = `فهرست و نقشه‌ی ${label} تهران — برای انتخاب بهتر محل زندگی نزدیک به ${label}، در خانه‌داده.`;

  return {
    title,
    description,
    alternates: { canonical: `/places/${params.category}` },
    openGraph: { title, description, type: 'website' },
  };
}

const PlaceCategoryPage = () => <PlacesCategoryClient />;

export default PlaceCategoryPage;
