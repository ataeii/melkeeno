import Link from 'next/link';
import Image from 'next/image';
import { FaArrowAltCircleLeft, FaBed, FaBath, FaRulerCombined } from 'react-icons/fa';
import connectDB from '@/config/database';
import Property from '@/models/Property';
import PropertySearchForm from '@/components/PropertySearchForm';

export const metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

const getSearchResults = async (location, propertyType) => {
  await connectDB();

  const locationPattern = new RegExp(location, 'i');

  let query = {
    $or: [
      { name: locationPattern },
      { description: locationPattern },
      { 'location.street': locationPattern },
      { 'location.city': locationPattern },
      { 'location.state': locationPattern },
      { 'location.zipcode': locationPattern },
    ],
  };

  if (propertyType && propertyType !== 'All') {
    query.type = new RegExp(propertyType, 'i');
  }

  const properties = await Property.find(query);
  return JSON.parse(JSON.stringify(properties));
};

const formatToman = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' میلیارد تومان';
  if (n >= 1e6) return (n / 1e6).toFixed(0) + ' میلیون تومان';
  return n.toLocaleString() + ' تومان';
};

const formatRate = (property) => {
  if (property.listing_type === 'buy') {
    return property.sale_price ? formatToman(property.sale_price) : 'تماس بگیرید';
  }
  const rate = property.rates?.monthly || property.rates?.weekly || property.rates?.nightly;
  if (rate) return formatToman(rate) + '/ماه';
  if (property.deposit) return 'رهن کامل: ' + formatToman(property.deposit);
  return 'تماس بگیرید';
};

const SearchResultsPage = async ({ searchParams }) => {
  const location = searchParams.location || '';
  const propertyType = searchParams.propertyType || '';

  let properties = [];
  try {
    properties = await getSearchResults(location, propertyType);
  } catch (error) {
    console.log(error);
  }

  return (
    <>
      <section className='bg-blue-700 py-4'>
        <div className='max-w-7xl mx-auto px-4 flex flex-col items-start sm:px-6 lg:px-8'>
          <PropertySearchForm />
        </div>
      </section>
      <section className='px-4 py-6'>
        <div className='container-xl lg:container m-auto px-4 py-6'>
          <Link
            href='/properties'
            className='flex items-center text-blue-500 hover:underline mb-3'
          >
            <FaArrowAltCircleLeft className='mr-2 mb-1' /> Back To Properties
          </Link>
          <h1 className='text-2xl mb-4'>Search Results</h1>
          {properties.length === 0 ? (
            <p>No search results found</p>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {properties.map((property) => (
                <Link
                  key={property._id}
                  href={`/properties/${property._id}`}
                  className='bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden block'
                >
                  <div className='relative h-48 bg-gray-100'>
                    {property.images?.[0] ? (
                      <Image
                        src={property.images[0]}
                        alt={property.name}
                        fill
                        sizes='(max-width: 768px) 100vw, 33vw'
                        className='object-cover'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-6xl'>
                        🏠
                      </div>
                    )}
                    <div className='absolute top-2 right-2 bg-white px-3 py-1 rounded-lg text-blue-700 font-bold text-sm shadow'>
                      {formatRate(property)}
                    </div>
                  </div>
                  <div className='p-3'>
                    <h3 className='font-bold text-gray-800 text-sm mb-1 line-clamp-2 leading-relaxed'>
                      {property.name}
                    </h3>
                    {property.location?.city && (
                      <p className='text-gray-500 text-xs mb-2 flex items-center gap-1'>
                        <span>📍</span>
                        <span>{property.location.city}</span>
                      </p>
                    )}
                    <div className='flex items-center gap-3 text-gray-600 text-xs'>
                      {property.square_feet && (
                        <span className='flex items-center gap-1'>
                          <FaRulerCombined className='text-gray-400' />
                          {property.square_feet}
                        </span>
                      )}
                      {property.beds != null && (
                        <span className='flex items-center gap-1'>
                          <FaBed className='text-gray-400' />
                          {property.beds}
                        </span>
                      )}
                      {property.baths != null && (
                        <span className='flex items-center gap-1'>
                          <FaBath className='text-gray-400' />
                          {property.baths}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};
export default SearchResultsPage;
