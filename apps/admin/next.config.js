/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.dockpulse.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
