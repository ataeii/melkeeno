import Link from 'next/link';
import ListingCard from '@/components/ListingCard';
import { fetchProperties } from '@/utils/requests';

const HomeProperties = async () => {
  const data = await fetchProperties();

  const recentProperties = data.properties
    .sort(() => Math.random() - Math.random())
    .slice(0, 3);

  return (
    <>
      <section className='px-4 py-12'>
        <div className='container-xl lg:container m-auto'>
          <h2 className='text-3xl font-extrabold text-gray-900 mb-8 text-center'>
            آگهی‌های اخیر
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {recentProperties.length === 0 ? (
              <p className='text-center text-gray-400 col-span-full'>آگهی‌ای یافت نشد</p>
            ) : (
              recentProperties.map((property) => (
                <ListingCard key={property._id} property={property} />
              ))
            )}
          </div>
        </div>
      </section>

      <section className='m-auto max-w-lg mb-16 px-6'>
        <Link
          href='/properties'
          className='block bg-blue-600 text-white text-center font-semibold py-4 px-6 rounded-full hover:bg-blue-700 transition-colors shadow-md'
        >
          مشاهده همه آگهی‌ها
        </Link>
      </section>
    </>
  );
};
export default HomeProperties;
