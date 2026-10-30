import { MetadataRoute } from 'next'
import { routing } from '@/navigation'
import { getArticleSummaries } from '@/lib/cms'
import { BASE_URL } from '@/lib/seo'

// De sitemap wordt bij de build gegenereerd; hiermee verversen de artikel-URL's mee.
export const revalidate = 600

// Statische routes onder /[locale]. Elke URL draagt een taalprefix: de proxy (src/proxy.ts)
// (localePrefix 'always') stuurt prefixloze paden door, dus die horen niet in de sitemap.
// /login en /signup staan er bewust niet in: die pagina's zijn noindex.
const STATIC_ROUTES = [
  '',
  '/features',
  '/download',
  '/help',
  '/how-it-works',
  '/linkedin-notes-extension',
  '/use-cases/recruiters',
  '/use-cases/sales',
  '/use-cases/networking-events',
  '/over',
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
  if (['/features', '/how-it-works', '/over', '/linkedin-notes-extension'].includes(route)) {
    return { priority: 0.8, changeFrequency: 'monthly' }
  }
  if (route.startsWith('/use-cases/')) return { priority: 0.7, changeFrequency: 'monthly' }
  return { priority: 0.5, changeFrequency: 'monthly' }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // Geen lastModified voor de statische pagina's: een build-tijd als wijzigingsdatum is
  // geen echte datum en leert Google dat het veld onbetrouwbaar is.
  for (const route of STATIC_ROUTES) {
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [locale, `${BASE_URL}/${locale}${route}`]),
    )
    for (const locale of routing.locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${route}`,
        alternates: { languages },
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
