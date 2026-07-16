import connectDB from '@/config/database';
import Property from '@/models/Property';

export const dynamic = 'force-dynamic';

const DOMAIN = 'https://melkeeno.ir';

export default async function sitemap() {
  await connectDB();
  const properties = await Property.find().select('_id updatedAt');

  const propertyUrls = properties.map((property) => ({
    url: `${DOMAIN}/properties/${property._id}`,
    lastModified: property.updatedAt,
  }));

  return [
    {
      url: DOMAIN,
      lastModified: new Date(),
    },
    ...propertyUrls,
  ];
}
