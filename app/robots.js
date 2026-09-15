const DOMAIN = 'https://khanedade.ir';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
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
