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
    return {
      beforeFiles: [
        // === Phase (MTG Client) WebSocket Proxy ===
        {
          source: '/phase-ws/:path*',
          destination: 'http://127.0.0.1:9374/:path*',
        },
      ],
      afterFiles: [
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
      ],
      fallback: [
        // === Phase SPA Catch-all ===
        // If a request starts with /phase/ but doesn't match a static file in public/phase/,
        // rewrite it to /phase/index.html so React Router can handle it.
        {
          source: '/phase/:path*',
          destination: '/phase/index.html',
        }
      ]
    };
  },
};

export default withPWA(nextConfig);