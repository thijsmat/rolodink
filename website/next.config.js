const createNextIntlPlugin = require('next-intl/plugin');

// Let next-intl auto-discover the config at src/i18n.ts
// which re-exports from ./i18n/request.ts
const withNextIntl = createNextIntlPlugin();

// Bron van de artikelafbeeldingen onder /over (zie /cms/README.md).
const cmsUrl = new URL(process.env.CMS_BASE_URL || 'https://cms.rolodink.app');

/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

module.exports = withNextIntl(nextConfig);
