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
};

module.exports = nextConfig;
