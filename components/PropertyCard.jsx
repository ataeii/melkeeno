'use client';
import Link from 'next/link';
import { FaBed, FaRulerCombined, FaBuilding, FaUserFriends } from 'react-icons/fa';
import BookmarkToggle from './BookmarkToggle';
import PriceGauge from './PriceGauge';

function formatPrice(price) {
  if (!price || price === 0) return null;
  if (price >= 1e9) return (price / 1e9).toFixed(1) + ' میلیارد';
  if (price >= 1e6) return (price / 1e6).toFixed(0) + ' میلیون';
  return price.toLocaleString();
}

const PriceEstimateBadge = ({ property }) => {
  if (property.listing_type === 'buy' && property.price_range_typical) {
    return (
      <PriceGauge
        ownPrice={property.price}
        kind='sale'
        estimate={{
          typical: property.price_range_typical,
          min: property.price_range_min,
          max: property.price_range_max,
          verdict: property.price_verdict,
          verdictPct: property.price_verdict_pct,
          confidence: property.price_confidence,
          compCount: property.price_comp_count,
          compPpm2: property.price_comp_ppm2,
          flag: property.price_flag,
        }}
      />
    );
  }
  if (property.listing_type === 'rent' && property.rent_range_typical) {
    return (
      <PriceGauge
        ownPrice={property.rent_equiv}
        kind='rent'
        estimate={{
          typical: property.rent_range_typical,
          min: property.rent_range_min,
          max: property.rent_range_max,
          verdict: property.rent_verdict,
          verdictPct: property.rent_verdict_pct,
          confidence: property.rent_confidence,
          compCount: property.rent_comp_count,
          compPpm2: property.rent_comp_ppm2,
          flag: property.rent_flag,
        }}
      />
    );
  }
  return null;
};

const PropertyCard = ({ property, onClick, className }) => {
  const priceDisplay =
    property.listing_type === 'short_term'
      ? property.price
        ? 'از ' + formatPrice(property.price) + ' تومان'
        : 'تماس بگیرید'
      : property.listing_type === 'rent'
      ? property.rent
        ? formatPrice(property.rent) + '/ماه'
        : property.deposit
        ? 'ودیعه: ' + formatPrice(property.deposit)
        : 'تماس بگیرید'
      : property.price
      ? formatPrice(property.price)
      : 'تماس بگیرید';

  return (
    <div
      id={property.token}
      className={`bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden ${className || ''}`}
      onClick={() => onClick && onClick(property.token)}
    >
      {/* Image */}
      <div className='relative h-48 bg-gray-100'>
        {property.image_url ? (
          <img
            src={property.image_url}
            alt={property.title || 'ملک'}
            className='w-full h-full object-cover'
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`w-full h-full items-center justify-center text-6xl ${property.image_url ? 'hidden' : 'flex'}`}
          style={{ background: '#f3f4f6' }}
        >
          🏠
        </div>

        {/* Price badge */}
        <div className='absolute top-2 right-2 bg-white px-3 py-1 rounded-lg text-blue-700 font-bold text-sm shadow'>
          {priceDisplay}
        </div>

        {/* Type badge */}
        <div
          className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold text-white ${
            property.listing_type === 'short_term'
              ? 'bg-purple-600'
              : property.listing_type === 'rent'
              ? 'bg-green-600'
              : 'bg-blue-700'
          }`}
        >
          {property.listing_type === 'short_term'
            ? 'اجاره کوتاه‌مدت'
            : property.listing_type === 'rent'
            ? 'اجاره'
            : 'فروش'}
        </div>

        {/* Bookmark toggle */}
        <BookmarkToggle
          type='listing'
          id={property.token}
          className='absolute bottom-2 left-2 bg-white w-11 h-11 shadow text-base'
        />
      </div>

      {/* Body */}
      <div className='p-3'>
        {/* Title */}
        <h3 className='font-bold text-gray-800 text-sm mb-1 line-clamp-2 leading-relaxed'>
          {property.title || 'آگهی ملک'}
        </h3>

        {/* District */}
        {property.district && (
          <p className='text-gray-500 text-xs mb-2 flex items-center gap-1'>
            <span>📍</span>
            <span>{property.district}</span>
          </p>
        )}

        {/* Match commute time (family finder results only) */}
        {property.match_score_min != null && (
          <p className='text-xs text-blue-700 bg-blue-50 rounded-full px-2 py-1 mb-2 inline-block'>
            میانگین زمان تردد: {property.match_score_min} دقیقه
          </p>
        )}

        {/* Specs row */}
        <div className='flex items-center gap-3 text-gray-600 text-xs mb-2'>
          {property.area_m2 && (
            <span className='flex items-center gap-1'>
              <FaRulerCombined className='text-gray-400' />
              {property.area_m2} م²
            </span>
          )}
          {property.rooms != null && property.rooms > 0 && (
            <span className='flex items-center gap-1'>
              <FaBed className='text-gray-400' />
              {property.rooms} خواب
            </span>
          )}
          {property.listing_type === 'short_term' && property.max_guests != null && (
            <span className='flex items-center gap-1'>
              <FaUserFriends className='text-gray-400' />
              تا {property.max_guests} نفر
            </span>
          )}
          {property.floor != null && (
            <span className='flex items-center gap-1'>
              <FaBuilding className='text-gray-400' />
              طبقه {property.floor}
            </span>
          )}
          {property.year_built && (
            <span className='text-gray-400'>سال {property.year_built}</span>
          )}
        </div>

        <PriceEstimateBadge property={property} />

        {/* Amenity badges */}
        <div className='flex flex-wrap gap-1 mb-2'>
          {property.has_parking && (
            <span className='bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full'>پارکینگ</span>
          )}
          {property.has_elevator && (
            <span className='bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full'>آسانسور</span>
          )}
          {property.has_warehouse && (
            <span className='bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full'>انباری</span>
          )}
          {property.has_balcony && (
            <span className='bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full'>بالکن</span>
          )}
          {property.is_furnished && (
            <span className='bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full'>مبله</span>
          )}
          {property.has_pool && (
            <span className='bg-cyan-50 text-cyan-700 text-xs px-2 py-0.5 rounded-full'>استخر</span>
          )}
          {property.has_jacuzzi && (
            <span className='bg-cyan-50 text-cyan-700 text-xs px-2 py-0.5 rounded-full'>جکوزی</span>
          )}
          {property.has_sauna && (
            <span className='bg-cyan-50 text-cyan-700 text-xs px-2 py-0.5 rounded-full'>سونا</span>
          )}
        </div>

        {/* Footer -- "مشاهده جزئیات" (the real on-site detail page) is the
            primary action now; the external source link is demoted to
            small secondary text, since there used to be no on-site detail
            page at all and this external link was the only way to see
            more than the card summary. px-4 py-2.5 (not the original
            px-3 py-1.5) keeps this near the ~44px mobile tap-target
            minimum -- the old size was closer to 28px tall. */}
        <div className='flex items-center justify-between gap-2 pt-2 border-t border-gray-100'>
          <Link
            href={`/properties/listing/${property.token}`}
            onClick={(e) => e.stopPropagation()}
            className='bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors'
          >
            مشاهده جزئیات
          </Link>
          {property.url && (
            <a
              href={property.url}
              target='_blank'
              rel='noopener noreferrer'
              onClick={(e) => e.stopPropagation()}
              className='text-[11px] text-gray-400 hover:text-blue-600 hover:underline truncate'
            >
              {property.source === 'kilid' ? 'مشاهده در کیلید ↗' : 'مشاهده در دیوار ↗'}
            </a>
          )}
        </div>
        {property.agency_name && (
          <p className='text-[11px] text-gray-400 truncate mt-1.5'>{property.agency_name}</p>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;
