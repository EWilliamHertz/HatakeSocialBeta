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
        destination: 'https://mtg-liart-seven.vercel.app/',
      },
      {
        source: '/mtg/:path*',
        destination: 'https://mtg-liart-seven.vercel.app/:path*',
      },
      {
        source: '/ouyrie',
        destination: 'https://mtg-liart-seven.vercel.app/',
      },
      {
        source: '/ouyrie/:path*',
        destination: 'https://mtg-liart-seven.vercel.app/:path*',
      },
      
      // === Euryx (Pokémon Client) Routing ===
      // Replace YOUR_EURYX_VERCEL_URL when you deploy the Euryx repository
      {
        source: '/pkmn',
        destination: 'https://YOUR_EURYX_VERCEL_URL.vercel.app/',
      },
      {
        source: '/pkmn/:path*',
        destination: 'https://YOUR_EURYX_VERCEL_URL.vercel.app/:path*',
      },
      {
        source: '/euryx',
        destination: 'https://YOUR_EURYX_VERCEL_URL.vercel.app/',
      },
      {
        source: '/euryx/:path*',
        destination: 'https://YOUR_EURYX_VERCEL_URL.vercel.app/:path*',
      }
    ];
  },
};

export default withPWA(nextConfig);