const DOMAIN = 'https://melkeeno.ir';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/properties/add',
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
