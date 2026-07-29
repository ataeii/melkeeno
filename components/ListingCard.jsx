import Link from 'next/link';
import Image from 'next/image';
import { FaBed, FaBath, FaRulerCombined } from 'react-icons/fa';

const formatToman = (n) => {
  if (!n) return null;
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' میلیارد تومان';
  if (n >= 1e6) return (n / 1e6).toFixed(0) + ' میلیون تومان';
  return n.toLocaleString() + ' تومان';
};

const getPriceDisplay = (property) => {
  if (property.listing_type === 'buy') {
    return property.sale_price ? formatToman(property.sale_price) : 'تماس بگیرید';
  }
  const rate =
    property.rates?.monthly || property.rates?.weekly || property.rates?.nightly;
  if (rate) return `${formatToman(rate)} / ماه`;
  if (property.deposit) return `رهن کامل: ${formatToman(property.deposit)}`;
  return 'تماس بگیرید';
};

const ListingCard = ({ property }) => {
  const address = [property.location?.city, property.location?.state]
    .filter(Boolean)
    .join('، ');

  return (
    <Link
      href={`/properties/${property._id}`}
      className='group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1'
    >
      <div className='relative aspect-[4/3] bg-gray-100'>
        {property.images?.[0] ? (
          <Image
            src={property.images[0]}
            alt={property.name}
            fill
            sizes='(max-width: 768px) 100vw, 33vw'
            className='object-cover'
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center text-6xl'>🏠</div>
        )}
        <span
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow ${
            property.listing_type === 'buy' ? 'bg-blue-600' : 'bg-emerald-600'
          }`}
        >
          {property.listing_type === 'buy' ? 'فروش' : 'اجاره'}
        </span>
      </div>

      <div className='p-4' dir='rtl'>
        <p className='text-lg font-extrabold text-gray-900 mb-1'>
          {getPriceDisplay(property)}
        </p>
        <h3 className='text-sm font-semibold text-gray-700 truncate mb-2'>
          {property.name}
        </h3>

        <div className='flex items-center gap-3 text-gray-500 text-xs mb-2'>
          {property.beds != null && (
            <span className='flex items-center gap-1'>
              <FaBed /> {property.beds} خواب
            </span>
          )}
          {property.baths != null && (
            <span className='flex items-center gap-1'>
              <FaBath /> {property.baths} سرویس
            </span>
          )}
          {property.square_feet && (
            <span className='flex items-center gap-1'>
              <FaRulerCombined /> {property.square_feet} متر
            </span>
          )}
        </div>

        {address && <p className='text-xs text-gray-400 truncate'>📍 {address}</p>}
      </div>
    </Link>
  );
};

export default ListingCard;
