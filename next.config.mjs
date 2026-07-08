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
        // === Phase Static Assets (card data, icons, audio, etc) ===
        {
          source: '/card-data.json',
          destination: '/phase/card-data.json',
        },
        {
          source: '/scryfall-data.json',
          destination: '/phase/scryfall-data.json',
        },
        {
          source: '/scryfall-printings.json',
          destination: '/phase/scryfall-printings.json',
        },
        {
          source: '/scryfall-token-images.json',
          destination: '/phase/scryfall-token-images.json',
        },
        {
          source: '/scryfall-sets.json',
          destination: '/phase/scryfall-sets.json',
        },
        {
          source: '/card-names.json',
          destination: '/phase/card-names.json',
        },
        {
          source: '/set-list.json',
          destination: '/phase/set-list.json',
        },
        {
          source: '/decks.json',
          destination: '/phase/decks.json',
        },
        {
          source: '/draft-pools.json',
          destination: '/phase/draft-pools.json',
        },
        {
          source: '/card-data-meta.json',
          destination: '/phase/card-data-meta.json',
        },
        {
          source: '/coverage-data.json',
          destination: '/phase/coverage-data.json',
        },
        {
          source: '/coverage-summary.json',
          destination: '/phase/coverage-summary.json',
        },
        {
          source: '/icons/:path*',
          destination: '/phase/icons/:path*',
        },
        {
          source: '/audio/:path*',
          destination: '/phase/audio/:path*',
        },
        {
          source: '/battlefield/:path*',
          destination: '/phase/battlefield/:path*',
        },
        {
          source: '/preview-icons/:path*',
          destination: '/phase/preview-icons/:path*',
        },
        {
          source: '/feeds/:path*',
          destination: '/phase/feeds/:path*',
        }
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