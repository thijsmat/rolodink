import { MetadataRoute } from 'next'
import { getPathname, routing } from '@/navigation'
import { getArticleSummaries } from '@/lib/cms'
import { BASE_URL } from '@/lib/seo'

// De sitemap wordt bij de build gegenereerd; hiermee verversen de artikel-URL's mee.
export const revalidate = 600

// Statische routes onder /[locale], als sleutels van `routing.pathnames`. Elke URL draagt
// een taalprefix: de proxy (src/proxy.ts) (localePrefix 'always') stuurt prefixloze paden
// door, dus die horen niet in de sitemap. De URL per taal komt uit getPathname, want
// /over heet in het Engels /about.
// /login en /signup staan er bewust niet in: die pagina's zijn noindex.
const STATIC_ROUTES = [
  '/',
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
] as const

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

type StaticRoute = (typeof STATIC_ROUTES)[number]

function staticEntry(route: StaticRoute): { priority: number; changeFrequency: ChangeFrequency } {
  if (route === '/') return { priority: 1.0, changeFrequency: 'weekly' }
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
    const urls = Object.fromEntries(
      routing.locales.map((locale) => [locale, `${BASE_URL}${getPathname({ locale, href: route })}`]),
    )
    for (const locale of routing.locales) {
      entries.push({
        url: urls[locale],
        alternates: { languages: urls },
        ...staticEntry(route),
      })
    }
  }

  // Artikelen uit het CMS; bij een storing blijft de rest van de sitemap gewoon werken.
  const articles = await getArticleSummaries()

  // Alleen talen met een echte tekst: zonder Engelse vertaling is /en/about/<slug> een
  // kopie van de Nederlandse pagina en wijst zijn canonical daarheen.
  for (const article of articles) {
    const href = { pathname: '/over/[slug]', params: { slug: article.slug } } as const
    const locales = article.hasEnglish ? routing.locales : (['nl'] as const)
    const urls = Object.fromEntries(
      locales.map((locale) => [locale, `${BASE_URL}${getPathname({ locale, href })}`]),
    )
    for (const locale of locales) {
      entries.push({
        url: urls[locale],
        ...(locales.length > 1 && { alternates: { languages: urls } }),
        lastModified: article.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  }

  return entries
}
