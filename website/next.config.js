const createNextIntlPlugin = require('next-intl/plugin');

// Let next-intl auto-discover the config at src/i18n.ts
// which re-exports from ./i18n/request.ts
const withNextIntl = createNextIntlPlugin();

// Bron van de artikelafbeeldingen onder /over (zie /cms/README.md).
const cmsUrl = new URL(process.env.CMS_BASE_URL || 'https://cms.rolodink.app');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // @rolodink/core (packages/core) ships TypeScript source, not a build.
  transpilePackages: ['@rolodink/core'],
  // Map Vercel-managed Supabase env vars (without NEXT_PUBLIC_ prefix)
  // to client-accessible NEXT_PUBLIC_ versions at build time.
  // If NEXT_PUBLIC_ vars already exist (e.g. local .env.local), they take priority.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  },
  typedRoutes: true,
  images: {
    // Artikelafbeeldingen komen uit het CMS (cms.rolodink.app, zie /cms/README.md).
    remotePatterns: [
      {
        protocol: cmsUrl.protocol.replace(':', ''),
        hostname: cmsUrl.hostname,
        port: cmsUrl.port,
        pathname: '/storage/uploads/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  // PostHog via het eigen domein, zodat adblockers de meting niet wegfilteren
  // (zie src/components/analytics.tsx). EU-regio.
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: 'https://eu-assets.i.posthog.com/static/:path*' },
      { source: '/ingest/:path*', destination: 'https://eu.i.posthog.com/:path*' },
    ];
  },
  // PostHog-endpoints eindigen op een slash; zonder dit stuurt Next een redirect.
  skipTrailingSlashRedirect: true,
  // Geen enkele pagina hoort in een frame van een andere site. Zonder deze
  // headers kon /login onzichtbaar in een iframe worden geladen (clickjacking).
  // Bewust geen volledige CSP: die vraagt eerst een inventaris van alle
  // scripts (PostHog, next-intl) en hoort in een eigen wijziging.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
