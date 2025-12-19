import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://rolodink.app'
  const locales = ['en', 'nl']

  // List of routes that exist in the app
  const routes = [
    '',
    '/features',
    '/testimonials',
    '/download',
    '/pricing',
    '/help',
    '/how-it-works',
    '/login',
    '/signup',
    '/privacy',
    '/terms',
    '/security',
    '/disclaimer',
    '/changelog'
  ]

  const sitemapEntries: MetadataRoute.Sitemap = []

  // Add entries for each route and locale
  routes.forEach(route => {
    locales.forEach(locale => {
      // For default locale (nl), we can serve at root, but for consistency with next-intl 
      // and canonical URLs, we should be careful. 
      // Based on the middleware config:
      // defaultLocale is 'nl'. defineRouting usually redirects root to default locale 
      // or serves default locale at root depending on 'localePrefix'. 
      // In navigation.ts we set `localePrefix: 'always'` previously but then switched to `defineRouting` default which is 'always'.
      // EXCEPT I noticed in my manual navigation.ts edit I didn't explicitly set prefix.
      // Default defineRouting prefix is 'always' for non-default, but 'as-needed' behavior depends on config. 
      // Actually, standard practice for SEO with next-intl:
      // - Root '/' -> Usually redirects to '/nl' or shows NL content.
      // - '/nl' -> NL content
      // - '/en' -> EN content

      const localePath = locale === 'nl' ? '' : `/${locale}`
      const url = `${baseUrl}${localePath}${route}`

      let priority = 0.5
      let changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' = 'monthly'

      if (route === '') {
        priority = 1.0
        changeFrequency = 'weekly'
      } else if (route === '/download') {
        priority = 0.9
        changeFrequency = 'weekly'
      } else if (['/features', '/how-it-works'].includes(route)) {
        priority = 0.8
        changeFrequency = 'monthly'
      } else if (['/login', '/signup'].includes(route)) {
        priority = 0.7
        changeFrequency = 'yearly' // These pages don't change often in terms of SEO content
      }

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency,
        priority
      })
    })
  })

  return sitemapEntries
}
