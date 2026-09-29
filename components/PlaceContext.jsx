import Link from 'next/link';
import { findNeighborhood } from '@/lib/neighborhoods';
import { cleanText, formatDistance, formatToman, toFa, within, namedParks, displayName } from '@/lib/place';

// Server-rendered "what's around this place" block shared by school,
// hospital and library pages. Everything comes from /api/place-context;
// sections with no data are simply left out. The nearby-listing links are
// also the internal links Google needs to reach listing pages.
const listingPrice = (l) =>
  l.listing_type === 'rent'
    ? [l.deposit ? `ودیعه ${formatToman(l.deposit)}` : null, l.rent ? `اجاره ${formatToman(l.rent)}` : null]
        .filter(Boolean)
        .join(' / ') || 'توافقی'
    : formatToman(l.price) || 'توافقی';

const NearbyRow = ({ href, name, meta, distance }) => (
  <li className='flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0'>
    <div className='min-w-0'>
      {href ? (
        <Link href={href} className='text-sm font-semibold text-blue-700 hover:underline'>
          {name}
        </Link>
      ) : (
        <span className='text-sm font-semibold text-gray-700'>{name}</span>
      )}
      {meta && <p className='text-xs text-gray-500 truncate'>{meta}</p>}
    </div>
    <span className='text-xs text-gray-400 whitespace-nowrap'>{formatDistance(distance)}</span>
  </li>
);

const PlaceContext = ({ context, placeLabel }) => {
  if (!context) return null;
  const { prices = {}, vicinity } = context;
  const neighborhood = vicinity ? findNeighborhood(vicinity) : null;
  const listings = within(context.listings, context.radius_km);
  const schools = within(context.schools);
  const hospitals = within(context.hospitals);
  const libraries = within(context.libraries);
  const metro = within(context.metro)[0];
  const park = namedParks(context.park, 1.5)[0];
  const hasPrices = prices.buy_ppm2_median || prices.rent_median || prices.deposit_median;

  return (
    <div className='flex flex-col gap-6'>
      {hasPrices && (
        <div className='bg-white rounded-xl shadow-md p-5'>
          <h2 className='font-bold text-gray-800 mb-1'>
            قیمت مسکن در اطراف {placeLabel}
          </h2>
          <p className='text-xs text-gray-400 mb-3'>
            میانه‌ی آگهی‌های فعال در شعاع {toFa(context.radius_km, 1)} کیلومتری
          </p>
          <dl className='grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm'>
            {prices.buy_ppm2_median && (
              <div className='bg-gray-50 rounded-lg p-3'>
                <dt className='text-xs text-gray-500'>خرید، هر متر مربع</dt>
                <dd className='font-bold text-gray-800'>{formatToman(prices.buy_ppm2_median)}</dd>
                <dd className='text-[11px] text-gray-400'>{toFa(prices.buy_n)} آگهی</dd>
              </div>
            )}
            {prices.deposit_median && (
              <div className='bg-gray-50 rounded-lg p-3'>
                <dt className='text-xs text-gray-500'>ودیعه‌ی اجاره</dt>
                <dd className='font-bold text-gray-800'>{formatToman(prices.deposit_median)}</dd>
                <dd className='text-[11px] text-gray-400'>{toFa(prices.deposit_n)} آگهی</dd>
              </div>
            )}
            {prices.rent_median && (
              <div className='bg-gray-50 rounded-lg p-3'>
                <dt className='text-xs text-gray-500'>اجاره‌ی ماهانه</dt>
                <dd className='font-bold text-gray-800'>{formatToman(prices.rent_median)}</dd>
                <dd className='text-[11px] text-gray-400'>{toFa(prices.rent_n)} آگهی</dd>
              </div>
            )}
          </dl>
          {neighborhood && (
            <Link
              href={`/properties/district/${neighborhood.slug}`}
              className='inline-block mt-3 text-sm text-blue-700 font-semibold hover:underline'
            >
              راهنمای محله‌ی {neighborhood.label} و همه‌ی آگهی‌های آن ←
            </Link>
          )}
        </div>
      )}

      {listings.length > 0 && (
        <div className='bg-white rounded-xl shadow-md p-5'>
          <h2 className='font-bold text-gray-800 mb-2'>آگهی‌های خرید و اجاره نزدیک {placeLabel}</h2>
          <ul>
            {listings.map((l) => (
              <NearbyRow
                key={l.token}
                href={`/properties/listing/${l.token}`}
                name={cleanText(l.title) || 'آگهی ملک'}
                meta={[
                  l.listing_type === 'rent' ? 'اجاره' : 'فروش',
                  l.area_m2 ? `${toFa(l.area_m2)} متر` : null,
                  l.rooms ? `${toFa(l.rooms)} خواب` : null,
                  l.district,
                  listingPrice(l),
                ]
                  .filter(Boolean)
                  .join(' · ')}
                distance={l.distance_km}
              />
            ))}
          </ul>
        </div>
      )}

      {Boolean(metro || park || schools.length || hospitals.length || libraries.length) && (
        <div className='bg-white rounded-xl shadow-md p-5'>
          <h2 className='font-bold text-gray-800 mb-2'>در همین نزدیکی</h2>
          <ul>
            {metro && <NearbyRow href='/places/metro' name={`ایستگاه مترو ${metro.name}`} distance={metro.distance_km} />}
            {park && <NearbyRow href='/places/park' name={cleanText(park.name)} meta='بوستان' distance={park.distance_km} />}
            {schools.map((s) => (
              <NearbyRow
                key={`s${s.id}`}
                href={`/schools/${s.id}`}
                name={cleanText(s.name)}
                meta={[s.district_num != null ? `منطقه ${toFa(s.district_num)}` : null, s.gender].filter(Boolean).join(' · ')}
                distance={s.distance_km}
              />
            ))}
            {hospitals.map((h) => (
              <NearbyRow key={`h${h.id}`} href={`/places/hospital/${h.id}`} name={cleanText(h.name)} meta='بیمارستان' distance={h.distance_km} />
            ))}
            {libraries.map((b) => (
              <NearbyRow
                key={`b${b.id}`}
                href={`/places/library/${b.id}`}
                name={displayName('library', b, vicinity)}
                meta='کتابخانه'
                distance={b.distance_km}
              />
            ))}
          </ul>
          <p className='text-[11px] text-gray-400 mt-2'>فاصله‌ها به خط مستقیم است.</p>
        </div>
      )}
    </div>
  );
};

export default PlaceContext;
