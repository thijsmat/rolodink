import { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Login, signup and onboarding are not blocked here: they carry a noindex, which
      // crawlers can only read when they are allowed to fetch the page.
      disallow: ['/api/', '/auth/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
