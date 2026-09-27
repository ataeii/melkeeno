const DOMAIN = 'https://khanedade.ir';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      // Public, read-only data endpoints that pages load in the browser --
      // without these, Google renders /materials*, /offices and school
      // reviews with no content (the longer Allow rule wins over /api/).
      allow: [
        '/',
        '/api/material-prices',
        '/api/supplier-prices',
        '/api/offices',
        '/api/school-reviews',
      ],
      disallow: [
        '/properties/add',
        '/properties/sell',
        '/properties/*/edit',
        '/properties/saved',
        '/messages',
        '/profile',
        '/login',
        '/api/',
      ],
    },
    sitemap: `${DOMAIN}/sitemap.xml`,
  };
}
