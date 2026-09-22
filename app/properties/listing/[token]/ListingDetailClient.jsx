'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FaBed, FaRulerCombined, FaBuilding, FaArrowRight, FaWhatsapp, FaTelegramPlane, FaLink } from 'react-icons/fa';
import { fetchListing, fetchListings } from '@/lib/api';
import BookmarkToggle from '@/components/BookmarkToggle';
import PriceGauge from '@/components/PriceGauge';
import NearbyPlacesPanel from '@/components/NearbyPlacesPanel';
import PropertyCard from '@/components/PropertyCard';
import { findNeighborhood } from '@/lib/neighborhoods';

const PlacesMap = dynamic(() => import('@/components/PlacesMap'), { ssr: false });

function formatRelativeDate(iso) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'امروز اضافه شد';
  if (days === 1) return 'دیروز اضافه شد';
  if (days < 30) return `${days} روز پیش اضافه شد`;
  return null; // beyond a month, a relative label reads as stale rather than helpful
}

function formatPrice(price) {
  if (!price || price === 0) return null;
  if (price >= 1e9) return (price / 1e9).toFixed(1) + ' میلیارد';
  if (price >= 1e6) return (price / 1e6).toFixed(0) + ' میلیون';
  return price.toLocaleString();
}

const AMENITY_LABELS = {
  has_parking: 'پارکینگ',
  has_elevator: 'آسانسور',
  has_warehouse: 'انباری',
  has_balcony: 'بالکن',
  is_furnished: 'مبله',
  has_pool: 'استخر',
  has_jacuzzi: 'جکوزی',
  has_sauna: 'سونا',
};

// The real on-site detail page for a scraped listing -- previously this
// didn't exist at all, so PropertyCard's only "see more" option was the
// external Divar/Kilid link. That external link stays here too (small,
// secondary, near the bottom) for anyone who wants to verify the original
// posting, but everything a visitor actually needs is now on melkeeno.ir.
const ListingDetailClient = () => {
  const { token } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetchListing(token)
      .then((data) => {
        if (!data) {
          setError('این آگهی یافت نشد — ممکن است حذف یا منقضی شده باشد.');
        } else {
          setProperty(data);
        }
      })
      .catch(() => setError('خطا در بارگذاری آگهی'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!property?.district || !property?.listing_type) return;
    fetchListings({ district: property.district, listing_type: property.listing_type })
      .then((rows) => setSimilar(rows.filter((r) => r.token !== token).slice(0, 4)))
      .catch(() => setSimilar([]));
  }, [property?.district, property?.listing_type, token]);

  if (loading) {
    return (
      <div dir='rtl' className='max-w-5xl mx-auto px-4 py-16 text-center text-gray-400'>
        در حال بارگذاری...
      </div>
    );
  }

  if (error || !property) {
    return (
      <div dir='rtl' className='max-w-5xl mx-auto px-4 py-16 text-center'>
        <p className='text-gray-500 mb-4'>{error}</p>
        <Link href='/properties' className='text-blue-600 hover:underline'>
          بازگشت به فهرست آگهی‌ها
        </Link>
      </div>
    );
  }

  let images = [];
  try {
    images = JSON.parse(property.images || '[]');
  } catch {
    images = property.image_url ? [property.image_url] : [];
  }
  if (images.length === 0 && property.image_url) images = [property.image_url];

  const priceDisplay =
    property.listing_type === 'short_term'
      ? property.price
        ? 'از ' + formatPrice(property.price) + ' تومان / شب'
        : 'تماس بگیرید'
      : property.listing_type === 'rent'
      ? property.rent
        ? formatPrice(property.rent) + ' تومان/ماه'
        : property.deposit
        ? 'ودیعه: ' + formatPrice(property.deposit) + ' تومان'
        : 'تماس بگیرید'
      : property.price
      ? formatPrice(property.price) + ' تومان'
      : 'تماس بگیرید';

  const priceEstimate =
    property.listing_type === 'buy' && property.price_range_typical
      ? {
          ownPrice: property.price,
          kind: 'sale',
          estimate: {
            typical: property.price_range_typical,
            min: property.price_range_min,
            max: property.price_range_max,
            verdict: property.price_verdict,
            verdictPct: property.price_verdict_pct,
            confidence: property.price_confidence,
            compCount: property.price_comp_count,
            compPpm2: property.price_comp_ppm2,
            flag: property.price_flag,
          },
        }
      : property.listing_type === 'rent' && property.rent_range_typical
      ? {
          ownPrice: property.rent_equiv,
          kind: 'rent',
          estimate: {
            typical: property.rent_range_typical,
            min: property.rent_range_min,
            max: property.rent_range_max,
            verdict: property.rent_verdict,
            verdictPct: property.rent_verdict_pct,
            confidence: property.rent_confidence,
            compCount: property.rent_comp_count,
            compPpm2: property.rent_comp_ppm2,
            flag: property.rent_flag,
          },
        }
      : null;

  const amenities = Object.entries(AMENITY_LABELS).filter(([key]) => property[key]);
  const neighborhood = findNeighborhood(property.district);
  const freshnessLabel = formatRelativeDate(property.published_at || property.scraped_at);
  const shareUrl = `https://khanedade.ir/properties/listing/${property.token}`;
  const shareText = property.title || 'این آگهی رو ببین';

  return (
    <div dir='rtl' className='max-w-5xl mx-auto px-4 py-6'>
      <Link href='/properties' className='inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-4'>
        <FaArrowRight className='text-xs' /> بازگشت به فهرست آگهی‌ها
      </Link>

      {/* Image gallery */}
      <div className='mb-4'>
        <div className='relative w-full h-[280px] sm:h-[380px] md:h-[440px] bg-gray-100 rounded-xl overflow-hidden'>
          {images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[activeImage]} alt={property.title || 'ملک'} className='w-full h-full object-cover' />
          ) : (
            <div className='w-full h-full flex items-center justify-center text-6xl'>🏠</div>
          )}
          <BookmarkToggle type='listing' id={property.token} className='absolute top-3 left-3 bg-white w-11 h-11 shadow text-lg' />
        </div>
        {images.length > 1 && (
          <div className='flex gap-2 mt-2 overflow-x-auto'>
            {images.map((img, i) => (
              <button
                key={img + i}
                onClick={() => setActiveImage(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  activeImage === i ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt='' className='w-full h-full object-cover' />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 flex flex-col gap-4'>
          <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4'>
            <div className='flex items-start justify-between gap-3 mb-2'>
              <h1 className='text-xl font-extrabold text-gray-900'>{property.title || 'آگهی ملک'}</h1>
              <span
                className={`flex-shrink-0 px-2 py-1 rounded text-xs font-bold text-white ${
                  property.listing_type === 'short_term'
                    ? 'bg-purple-600'
                    : property.listing_type === 'rent'
                    ? 'bg-green-600'
                    : 'bg-blue-700'
                }`}
              >
                {property.listing_type === 'short_term' ? 'اجاره کوتاه‌مدت' : property.listing_type === 'rent' ? 'اجاره' : 'فروش'}
              </span>
            </div>
            {(property.district || freshnessLabel) && (
              <p className='text-gray-500 text-sm mb-3 flex items-center gap-2 flex-wrap'>
                {property.district && <span>📍 {property.district}</span>}
                {freshnessLabel && (
                  <span className='text-green-700 bg-green-50 text-xs px-2 py-0.5 rounded-full'>{freshnessLabel}</span>
                )}
              </p>
            )}
            <p className='text-2xl font-extrabold text-blue-700 mb-3'>{priceDisplay}</p>

            <div className='flex flex-wrap items-center gap-4 text-gray-600 text-sm mb-3 pb-3 border-b border-gray-100'>
              {property.area_m2 && (
                <span className='flex items-center gap-1.5'>
                  <FaRulerCombined className='text-gray-400' /> {property.area_m2} متر مربع
                </span>
              )}
              {property.rooms != null && property.rooms > 0 && (
                <span className='flex items-center gap-1.5'>
                  <FaBed className='text-gray-400' /> {property.rooms} خواب
                </span>
              )}
              {property.floor != null && (
                <span className='flex items-center gap-1.5'>
                  <FaBuilding className='text-gray-400' /> طبقه {property.floor}
                  {property.total_floors ? ` از ${property.total_floors}` : ''}
                </span>
              )}
              {property.year_built && <span className='text-gray-500'>سال ساخت {property.year_built}</span>}
            </div>

            {priceEstimate && (
              <div className='mb-3'>
                <PriceGauge {...priceEstimate} showDisclaimer />
              </div>
            )}

            {amenities.length > 0 && (
              <div className='flex flex-wrap gap-1.5 mb-3'>
                {amenities.map(([key, label]) => (
                  <span key={key} className='bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full'>
                    {label}
                  </span>
                ))}
              </div>
            )}

            {property.description && (
              <p className='text-sm text-gray-700 leading-relaxed whitespace-pre-line'>{property.description}</p>
            )}
          </div>

          {property.lat && property.lng && (
            <div className='bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden'>
              <div className='h-64'>
                <PlacesMap
                  places={[{ id: property.token, lat: property.lat, lng: property.lng, name: property.title, address: property.district }]}
                />
              </div>
            </div>
          )}
        </div>

        <div className='lg:col-span-1 flex flex-col gap-4'>
          <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm'>
            {property.agency_name && (
              <p className='text-gray-600 mb-2'>
                <span className='text-gray-400'>آگهی‌دهنده:</span> {property.agency_name}
              </p>
            )}
            {/* Secondary, de-emphasized -- the primary experience is this
                page itself now, not the original source. */}
            {property.url && (
              <a
                href={property.url}
                target='_blank'
                rel='noopener noreferrer'
                className='block text-center text-xs text-gray-400 hover:text-blue-600 hover:underline mt-2'
              >
                مشاهده آگهی اصلی در {property.source === 'kilid' ? 'کیلید' : 'دیوار'} ↗
              </a>
            )}
          </div>

          {neighborhood && (
            <div className='bg-blue-50 rounded-xl border border-blue-100 p-4 text-sm space-y-2'>
              <Link href={`/articles/${neighborhood.guideSlug}`} className='block hover:underline'>
                <p className='font-bold text-blue-800 mb-1'>📖 راهنمای محله‌ی {neighborhood.label}</p>
                <p className='text-blue-700 text-xs'>پیش از تصمیم‌گیری، این محله را بهتر بشناسید ←</p>
              </Link>
              <Link href={`/properties/district/${neighborhood.slug}`} className='block hover:underline pt-1 border-t border-blue-100'>
                <p className='text-blue-700 text-xs'>دیدن همه‌ی آگهی‌های {neighborhood.label} ←</p>
              </Link>
            </div>
          )}

          <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4'>
            <p className='text-sm font-bold text-gray-700 mb-2'>اشتراک‌گذاری این آگهی</p>
            <div className='flex gap-2'>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                target='_blank'
                rel='noopener noreferrer'
                className='flex-1 flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold py-2 rounded-lg transition-colors'
              >
                <FaWhatsapp /> واتساپ
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                target='_blank'
                rel='noopener noreferrer'
                className='flex-1 flex items-center justify-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold py-2 rounded-lg transition-colors'
              >
                <FaTelegramPlane /> تلگرام
              </a>
              <button
                type='button'
                onClick={() => navigator.clipboard?.writeText(shareUrl)}
                className='flex-1 flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-semibold py-2 rounded-lg transition-colors'
              >
                <FaLink /> کپی لینک
              </button>
            </div>
          </div>
        </div>
      </div>

      {property.lat && property.lng && (
        <div className='mt-6'>
          <NearbyPlacesPanel lat={property.lat} lng={property.lng} title='خدمات و اماکن نزدیک به این ملک' />
        </div>
      )}

      {similar.length > 0 && (
        <div className='mt-8'>
          <h2 className='text-lg font-extrabold text-gray-800 mb-3'>آگهی‌های مشابه در {property.district}</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            {similar.map((item) => (
              <PropertyCard key={item.token} property={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetailClient;
