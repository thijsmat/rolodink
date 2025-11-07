/** @type {import('next').NextConfig} */
const nextConfig = {
  // CORS headers are now handled dynamically by route handlers using buildCorsHeaders()
  // This allows for proper origin whitelisting instead of hardcoded values
  // See: src/lib/cors.ts for CORS implementation
};

module.exports = nextConfig;
