import { MetadataRoute } from 'next'
import { routing } from '@/navigation'
import { getArticleSummaries } from '@/lib/cms'

const BASE_URL = 'https://rolodink.app'

// De sitemap wordt bij de build gegenereerd; hiermee verversen de artikel-URL's mee.
export const revalidate = 600

// Statische routes onder /[locale]. Elke URL draagt een taalprefix: de middleware
// (localePrefix 'always') stuurt prefixloze paden door, dus die horen niet in de sitemap.
const STATIC_ROUTES = [
  '',
  '/features',
  '/testimonials',
  '/download',
  '/help',
  '/how-it-works',
  '/over',
  '/login',
  '/signup',
  '/privacy',
  '/terms',
  '/security',
  '/disclaimer',
  '/changelog',
]

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

function staticEntry(route: string): { priority: number; changeFrequency: ChangeFrequency } {
  if (route === '') return { priority: 1.0, changeFrequency: 'weekly' }
  if (route === '/download') return { priority: 0.9, changeFrequency: 'weekly' }
  if (['/features', '/how-it-works', '/over'].includes(route)) {
    return { priority: 0.8, changeFrequency: 'monthly' }
  }
  if (['/login', '/signup'].includes(route)) return { priority: 0.7, changeFrequency: 'yearly' }
  return { priority: 0.5, changeFrequency: 'monthly' }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const route of STATIC_ROUTES) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: now,
        ...staticEntry(route),
      })
    }
  }

  // Artikelen uit het CMS; bij een storing blijft de rest van de sitemap gewoon werken.
  const articles = await getArticleSummaries()

  for (const article of articles) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/over/${article.slug}`,
        lastModified: article.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  }

  return entries
}
