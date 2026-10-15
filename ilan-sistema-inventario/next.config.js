/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // A entrada do sistema leva direto ao patrimônio. Quem não estiver logado
  // é mandado para o login pela própria tela (lib/profile.tsx).
  async redirects() {
    return [{ source: '/', destination: '/equipamentos', permanent: false }]
  },
};

module.exports = nextConfig;
