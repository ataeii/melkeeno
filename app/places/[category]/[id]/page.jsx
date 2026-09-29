import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaArrowRight } from 'react-icons/fa';
import { fetchPoiList, fetchPlaceContext } from '@/lib/api';
import { pageMeta } from '@/lib/seo';
import PlaceContext from '@/components/PlaceContext';
import PlaceLocationMap from '@/components/PlaceLocationMap';
import {
  PLACE_PAGE_CATEGORIES,
  canonicalTwin,
  cleanText,
  displayName,
  landmarkOf,
  placeIntro,
  placeTitle,
} from '@/lib/place';

const DOMAIN = 'https://khanedade.ir';

// One page per hospital / library, built from our own data: the place's
// name/address/location plus its surroundings (vicinity, local housing
// prices, nearby listings, metro, schools...). Hospitals and libraries are
// named by vicinity rather than municipal district -- their names rarely
// say where they are, and a neighborhood name is what people search for.
async function load(params) {
  const meta = PLACE_PAGE_CATEGORIES[params.category];
  if (!meta) return null;
  const places = await fetchPoiList(params.category).catch(() => []);
  const place = places.find((p) => String(p.id) === String(params.id));
  if (!place || place.lat == null) return null;
  const context = await fetchPlaceContext({
    lat: place.lat,
    lng: place.lng,
    excludeKind: params.category,
    excludeId: place.id,
  }).catch(() => null);
  const twin = canonicalTwin(params.category, place, places);
  return { meta, place, twin, context, vicinity: context?.vicinity || null, landmark: landmarkOf(context) };
}

export async function generateMetadata({ params }) {
  const data = await load(params);
  if (!data) notFound();
  const { place, context, vicinity, landmark } = data;
  const title = `${placeTitle(params.category, place, vicinity, landmark)} | خانه‌داده`;
  const address = cleanText(place.address);
  const bits = [
    `${displayName(params.category, place, vicinity, landmark)}${vicinity ? ` در محدوده‌ی ${vicinity}` : ''}`,
    address ? `نشانی: ${address}` : null,
    context?.prices?.buy_ppm2_median ? 'قیمت مسکن و آگهی‌های خرید و اجاره‌ی اطراف' : 'امکانات اطراف',
  ].filter(Boolean);
  return pageMeta({
    title,
    description: `${bits.join('، ')} — در خانه‌داده.`.slice(0, 300),
    // A duplicate entry of the same place points search engines at the original.
    path: `/places/${params.category}/${(data.twin || place).id}`,
  });
}

const PlacePage = async ({ params }) => {
  const data = await load(params);
  if (!data) notFound();
  const { meta, place, context, vicinity, landmark } = data;
  const name = displayName(params.category, place, vicinity, landmark);
  const address = cleanText(place.address);

  const intro = placeIntro({
    name,
    kindPhrase: params.category === 'hospital' ? 'یک بیمارستان' : 'یک کتابخانه',
    vicinity,
    address,
    context,
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': meta.schemaType,
    name,
    url: `${DOMAIN}/places/${params.category}/${place.id}`,
    address: {
      '@type': 'PostalAddress',
      ...(address ? { streetAddress: address } : {}),
      addressLocality: 'تهران',
      addressCountry: 'IR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: place.lat, longitude: place.lng },
    ...(place.phone ? { telephone: place.phone } : {}),
  };

  return (
    <section dir='rtl' className='max-w-2xl mx-auto px-4 py-8'>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link
        href={`/places/${params.category}`}
        className='text-blue-600 text-sm font-semibold inline-flex items-center gap-1 mb-4'
      >
        <FaArrowRight /> همه‌ی {params.category === 'hospital' ? 'بیمارستان‌ها' : 'کتابخانه‌ها'}ی تهران
      </Link>

      <div className='bg-white rounded-xl shadow-md p-5 mb-6'>
        <h1 className='text-xl font-extrabold text-gray-800 mb-1'>{name}</h1>
        <p className='text-sm text-gray-500 mb-3'>
          {meta.noun}
          {vicinity ? ` · ${vicinity}` : ''} · تهران
        </p>
        {place.phone && (
          <p className='text-sm text-gray-600 mb-3'>
            تلفن: <span dir='ltr'>{place.phone}</span>
          </p>
        )}
        <div className='text-sm text-gray-700 leading-7 flex flex-col gap-2'>
          {intro.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

      <div className='bg-white rounded-xl shadow-md p-2 mb-6 h-64 overflow-hidden'>
        <PlaceLocationMap lat={place.lat} lng={place.lng} name={name} />
      </div>

      <PlaceContext context={context} placeLabel={name} />
    </section>
  );
};

export default PlacePage;
