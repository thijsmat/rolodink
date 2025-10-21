import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.builder.io',
        port: '',
        pathname: '/api/v1/image/assets/**',
      },
    ],
  },
}

export default nextConfig
