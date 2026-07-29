import { fetchProperties } from '@/utils/requests';
import ListingCard from './ListingCard';

const FeaturedProperties = async () => {
  const properties = await fetchProperties({
    showFeatured: true,
  });

  return (
    properties.length > 0 && (
      <section className='bg-blue-50/60 px-4 pt-12 pb-14'>
        <div className='container-xl lg:container m-auto'>
          <h2 className='text-3xl font-extrabold text-gray-900 mb-8 text-center'>
            آگهی‌های ویژه
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {properties.map((property) => (
              <ListingCard key={property._id} property={property} />
            ))}
          </div>
        </div>
      </section>
    )
  );
};
export default FeaturedProperties;
