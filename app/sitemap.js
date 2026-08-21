import connectDB from '@/config/database';
import Property from '@/models/Property';
import Article from '@/models/Article';

export const dynamic = 'force-dynamic';

const DOMAIN = 'https://melkeeno.ir';

export default async function sitemap() {
  await connectDB();
  const properties = await Property.find().select('_id updatedAt');
  const articles = await Article.find({ status: 'published' }).select('slug updatedAt');

  const propertyUrls = properties.map((property) => ({
    url: `${DOMAIN}/properties/${property._id}`,
    lastModified: property.updatedAt,
  }));

  const articleUrls = articles.map((article) => ({
    url: `${DOMAIN}/articles/${article.slug}`,
    lastModified: article.updatedAt,
  }));

  return [
    {
      url: DOMAIN,
      lastModified: new Date(),
    },
    {
      url: `${DOMAIN}/articles`,
      lastModified: new Date(),
    },
    ...propertyUrls,
    ...articleUrls,
  ];
}
