'use client';
import { FaBed, FaRulerCombined, FaBuilding } from 'react-icons/fa';

function formatPrice(price) {
  if (!price || price === 0) return null;
  if (price >= 1e9) return (price / 1e9).toFixed(1) + ' میلیارد';
  if (price >= 1e6) return (price / 1e6).toFixed(0) + ' میلیون';
  return price.toLocaleString();
}

const PropertyCard = ({ property, onClick, className }) => {
  const priceDisplay =
    property.listing_type === 'rent'
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
            property.listing_type === 'rent' ? 'bg-green-600' : 'bg-blue-700'
          }`}
        >
          {property.listing_type === 'rent' ? 'اجاره' : 'فروش'}
        </div>
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
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between pt-2 border-t border-gray-100'>
          {property.agency_name && (
            <span className='text-xs text-gray-400 truncate max-w-[120px]'>{property.agency_name}</span>
          )}
          {property.url && (
            <a
              href={property.url}
              target='_blank'
              rel='noopener noreferrer'
              onClick={(e) => e.stopPropagation()}
              className='text-xs text-blue-600 hover:text-blue-800 hover:underline mr-auto'
            >
              مشاهده در دیوار ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
