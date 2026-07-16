import Link from 'next/link';
import { notFound } from 'next/navigation';
import connectDB from '@/config/database';
import Property from '@/models/Property';
import PropertyHeaderImage from '@/components/PropertyHeaderImage';
import PropertyDetails from '@/components/PropertyDetails';
import PropertyImages from '@/components/PropertyImages';
import BookmarkButton from '@/components/BookmarkButton';
import PropertyContactForm from '@/components/PropertyContactForm';
import ShareButtons from '@/components/ShareButtons';
import { FaArrowLeft } from 'react-icons/fa';

const getProperty = async (id) => {
  await connectDB();
  const property = await Property.findById(id);
  if (!property) return null;
  return JSON.parse(JSON.stringify(property));
};

export async function generateMetadata({ params }) {
  const property = await getProperty(params.id);

  if (!property) {
    return { title: 'آگهی یافت نشد' };
  }

  const title = `${property.name} | ${property.location?.city || ''}`.trim();
  const description = (property.description || '').slice(0, 160);
  const image = property.images?.[0];

  return {
    title,
    description,
    alternates: {
      canonical: `/properties/${property._id}`,
    },
    openGraph: {
      title,
      description,
      images: image ? [image] : [],
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

const PropertyPage = async ({ params }) => {
  const property = await getProperty(params.id);

  if (!property) {
    notFound();
  }

  const rate = property.rates?.nightly || property.rates?.weekly || property.rates?.monthly;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.name,
    description: property.description,
    image: property.images,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.location?.street,
      addressLocality: property.location?.city,
      addressRegion: property.location?.state,
      postalCode: property.location?.zipcode,
    },
    ...(rate
      ? {
          offers: {
            '@type': 'Offer',
            price: rate,
            priceCurrency: 'IRR',
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyHeaderImage image={property.images[0]} />
      <section>
        <div className='container m-auto py-6 px-6'>
          <Link
            href='/properties'
            className='text-blue-500 hover:text-blue-600 flex items-center'
          >
            <FaArrowLeft className='mr-2' /> Back to Properties
          </Link>
        </div>
      </section>

      <section className='bg-blue-50'>
        <div className='container m-auto py-10 px-6'>
          <div className='grid grid-cols-1 md:grid-cols-70/30 w-full gap-6'>
            <PropertyDetails property={property} />
            <aside className='space-y-4'>
              <BookmarkButton property={property} />
              <ShareButtons property={property} />
              <PropertyContactForm property={property} />
            </aside>
          </div>
        </div>
      </section>
      <PropertyImages images={property.images} />
    </>
  );
};
export default PropertyPage;
