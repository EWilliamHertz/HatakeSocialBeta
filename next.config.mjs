import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
    ],
  },
  async rewrites() {
    return [
      // === Ouyrie (MTG Client) Routing ===
      {
        source: '/mtg',
        destination: 'https://mtg2-suqj.onrender.com/ouyrie',
      },
      {
        source: '/mtg/:path*',
        destination: 'https://mtg2-suqj.onrender.com/ouyrie/:path*',
      },
      {
        source: '/ouyrie',
        destination: 'https://mtg2-suqj.onrender.com/ouyrie',
      },
      {
        source: '/ouyrie/:path*',
        destination: 'https://mtg2-suqj.onrender.com/ouyrie/:path*',
      },
      
      // === Euryx (Pokémon Client) Routing ===
      {
        source: '/pkmn',
        destination: 'https://euryx.onrender.com/',
      },
      {
        source: '/pkmn/:path*',
        destination: 'https://euryx.onrender.com/:path*',
      },
      {
        source: '/euryx',
        destination: 'https://euryx.onrender.com/',
      },
      {
        source: '/euryx/:path*',
        destination: 'https://euryx.onrender.com/:path*',
      }
    ];
  },
};

export default withPWA(nextConfig);