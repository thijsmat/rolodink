/** @type {import('next').NextConfig} */
const nextConfig = {
  // @rolodink/core (packages/core) ships TypeScript source, not a build: Next
  // has to compile it like its own code. The API routes take the LinkedIn URL
  // canonicalisation from there, so it is one implementation with the
  // extension.
  transpilePackages: ['@rolodink/core'],
  // CORS headers are now handled dynamically by route handlers using buildCorsHeaders()
  // This allows for proper origin whitelisting instead of hardcoded values
  // See: src/lib/cors.ts for CORS implementation

  // api.rolodink.app serves the API only. Tell search engines on every response,
  // including the 404s and the static assets under /_next, to keep it out of the
  // index. robots.txt (src/app/robots.ts) stops the crawling; this header covers
  // anything that is fetched anyway.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

module.exports = nextConfig;
