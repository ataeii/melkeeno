/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['maplibre-gl'],
  // www.khanedade.ir was serving a full duplicate copy of the site (200,
  // not a redirect) -- consolidate onto the apex host.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.khanedade.ir' }],
        destination: 'https://khanedade.ir/:path*',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'postimage01.divarcdn.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 's100.divarcdn.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.divarcdn.com',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
