/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async redirects() {
    return [{ source: '/plataforma', destination: '/plataforma/igrejas', permanent: false }]
  },
};

module.exports = nextConfig;
