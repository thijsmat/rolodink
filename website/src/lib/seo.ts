import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getPathname, routing } from '@/navigation'

export const BASE_URL = 'https://rolodink.app'

// Pages whose title and description live in the `PageMeta` message namespace.
export const PAGE_PATHS = {
  features: '/features',
  howItWorks: '/how-it-works',
  download: '/download',
  help: '/help',
  changelog: '/changelog',
  privacy: '/privacy',
  terms: '/terms',
  security: '/security',
  disclaimer: '/disclaimer',
  linkedinNotes: '/linkedin-notes-extension',
  useCaseRecruiters: '/use-cases/recruiters',
  useCaseSales: '/use-cases/sales',
  useCaseEvents: '/use-cases/networking-events',
} as const

export type PageKey = keyof typeof PAGE_PATHS

export type AppLocale = (typeof routing.locales)[number]

// A route as the navigation helpers accept it: a key of `routing.pathnames`, or that key
// with its params for a dynamic route. Locale-specific paths (/over is /about in en) come
// from `getPathname`, so nothing here may build a URL by gluing `/${locale}` onto a path.
export type Href = Parameters<typeof getPathname>[0]['href']

// Every URL carries a locale prefix (localePrefix 'always'). `x-default` points at the
// default locale so crawlers have a fallback for languages we do not serve.
//
// `available` lists the locales that really have this page. A page that exists in one
// language only (an article without an English text) canonicals to that language and
// gets no hreflang pairs, instead of a second URL that repeats the same text.
export function localeAlternates(
  locale: AppLocale,
  href: Href,
  available: readonly AppLocale[] = routing.locales,
): NonNullable<Metadata['alternates']> {
  const canonicalLocale = available.includes(locale) ? locale : routing.defaultLocale
  const canonical = getPathname({ locale: canonicalLocale, href })
  if (available.length < 2) return { canonical }

  const languages: Record<string, string> = Object.fromEntries(
    available.map((l) => [l, getPathname({ locale: l, href })]),
  )
  languages['x-default'] = getPathname({ locale: routing.defaultLocale, href })
  return { canonical, languages }
}

// One share image per locale (1200×630), rendered from marketing/og/og-image.html with
// marketing/og/render.mjs. Fictional example note; no real people and no LinkedIn branding.
export function ogImage(locale: AppLocale): string {
  return `/og-image-${locale}.png`
}

export function openGraphFor(
  locale: AppLocale,
  href: Href,
  title: string,
  description: string,
  imageAlt: string,
): NonNullable<Metadata['openGraph']> {
  return {
    type: 'website',
    siteName: 'Rolodink',
    url: `${BASE_URL}${getPathname({ locale, href })}`,
    locale: locale === 'nl' ? 'nl_NL' : 'en_US',
    title,
    description,
    images: [{ url: ogImage(locale), width: 1200, height: 630, alt: imageAlt }],
  }
}

// The layout adds " | Rolodink" to every title. A title that already ends in the brand name
// (the about page, the changelog, an article called "Why I built Rolodink") would end in
// "Rolodink | Rolodink", so those are used as they are.
export function withBrand(title: string): string {
  return title.endsWith('Rolodink') ? title : `${title} | Rolodink`
}

// A page that sets `twitter` replaces the whole object from the layout, so without this every
// page would share the homepage's twitter:title and twitter:description in X and in apps that
// read twitter:* before og:*. Keep it in step with openGraphFor.
export function twitterFor(
  locale: AppLocale,
  title: string,
  description: string,
  imageAlt: string,
): NonNullable<Metadata['twitter']> {
  return { card: 'summary_large_image', title, description, images: [{ url: ogImage(locale), alt: imageAlt }] }
}

// Page-level metadata for the routes in PAGE_PATHS: unique title/description, a canonical
// that points at the page itself and hreflang pairs for both locales.
export async function pageMetadata(params: Promise<{ locale: string }>, page: PageKey): Promise<Metadata> {
  const locale = (await params).locale as AppLocale
  const path = PAGE_PATHS[page]
  const t = await getTranslations({ locale, namespace: 'PageMeta' })
  const { imageAlt } = await getHomeStrings(locale)
  const title = t(`${page}.title`)
  const description = t(`${page}.description`)

  return {
    title: { absolute: withBrand(title) },
    description,
    alternates: localeAlternates(locale, path),
    openGraph: openGraphFor(locale, path, withBrand(title), description, imageAlt),
    twitter: twitterFor(locale, withBrand(title), description, imageAlt),
  }
}

async function getHomeStrings(locale: string) {
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  return { title: t('title'), description: t('description'), imageAlt: t('imageAlt') }
}

export async function homeMetadata(params: Promise<{ locale: string }>): Promise<Metadata> {
  const locale = (await params).locale as AppLocale
  const { title, description, imageAlt } = await getHomeStrings(locale)

  return {
    title: { absolute: title },
    description,
    alternates: localeAlternates(locale, '/'),
    openGraph: openGraphFor(locale, '/', title, description, imageAlt),
    twitter: twitterFor(locale, title, description, imageAlt),
  }
}
