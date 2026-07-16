/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['maplibre-gl'],
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
