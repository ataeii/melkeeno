import PropertyCard from './PropertyCard';
import { fetchListings } from '@/lib/api';

// Was reading from the old MongoDB Property collection with a showFeatured
// flag nothing ever sets -- same root cause as HomeProperties.jsx's empty
// state. There's no manual "featured" flag on scraped listings, so this
// reinterprets "featured" as something real and useful instead: listings
// price_analysis.py already flagged as below_market (a genuine good deal),
// rather than an arbitrary/unused curation flag.
const FeaturedProperties = async () => {
  let properties = [];
  try {
    const listings = await fetchListings({ listing_type: 'buy,rent' });
    properties = (Array.isArray(listings) ? listings : [])
      .filter((p) => p.price_verdict === 'below_market')
      .sort(() => Math.random() - Math.random())
      .slice(0, 3);
  } catch {
    properties = [];
  }

  return (
    properties.length > 0 && (
      <section className='bg-blue-50/60 px-4 pt-12 pb-14'>
        <div className='container-xl lg:container m-auto'>
          <h2 className='text-3xl font-extrabold text-gray-900 mb-8 text-center'>
            آگهی‌های ویژه
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {properties.map((property) => (
              <PropertyCard key={property.token} property={property} />
            ))}
          </div>
        </div>
      </section>
    )
  );
};
export default FeaturedProperties;
