import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/navigation'

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

// Every URL carries a locale prefix (localePrefix 'always'). `x-default` points at the
// default locale so crawlers have a fallback for languages we do not serve.
export function localeAlternates(locale: string, path: string): NonNullable<Metadata['alternates']> {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      nl: `/nl${path}`,
      en: `/en${path}`,
      'x-default': `/${routing.defaultLocale}${path}`,
    },
  }
}

export function openGraphFor(
  locale: string,
  path: string,
  title: string,
  description: string,
  imageAlt: string,
): NonNullable<Metadata['openGraph']> {
  return {
    type: 'website',
    siteName: 'Rolodink',
    url: `${BASE_URL}/${locale}${path}`,
    locale: locale === 'nl' ? 'nl_NL' : 'en_US',
    title,
    description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: imageAlt }],
  }
}

// Page-level metadata for the routes in PAGE_PATHS: unique title/description, a canonical
// that points at the page itself and hreflang pairs for both locales.
export async function pageMetadata(params: Promise<{ locale: string }>, page: PageKey): Promise<Metadata> {
  const { locale } = await params
  const path = PAGE_PATHS[page]
  const t = await getTranslations({ locale, namespace: 'PageMeta' })
  const { imageAlt } = await getHomeStrings(locale)
  const title = t(`${page}.title`)
  const description = t(`${page}.description`)

  return {
    title,
    description,
    alternates: localeAlternates(locale, path),
    openGraph: openGraphFor(locale, path, `${title} | Rolodink`, description, imageAlt),
  }
}

async function getHomeStrings(locale: string) {
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  return { title: t('title'), description: t('description'), imageAlt: t('imageAlt') }
}

export async function homeMetadata(params: Promise<{ locale: string }>): Promise<Metadata> {
  const { locale } = await params
  const { title, description, imageAlt } = await getHomeStrings(locale)

  return {
    title: { absolute: title },
    description,
    alternates: localeAlternates(locale, ''),
    openGraph: openGraphFor(locale, '', title, description, imageAlt),
  }
}
