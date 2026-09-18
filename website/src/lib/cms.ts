import 'server-only'
import sanitizeHtml from 'sanitize-html'

/**
 * Data-laag voor de artikelen onder /over.
 *
 * De bron is een Cockpit CMS (headless) op cms.rolodink.app; zie /cms/README.md in de
 * monorepo. Alles hier draait server-side: de API-key blijft op de server en de HTML uit
 * het CMS wordt gesanitized voordat een pagina hem rendert.
 *
 * Caching: elke fetch zit in de Next.js Data Cache (10 minuten, tag "cms"). Het CMS
 * roept na een wijziging /api/revalidate aan, dat die tag ongeldig maakt.
 */

export const CMS_MODEL = 'over'
export const CMS_CACHE_TAG = 'cms'
const CMS_REVALIDATE_SECONDS = 600
const CMS_DEFAULT_BASE_URL = 'https://cms.rolodink.app'
const WORDS_PER_MINUTE = 200
const EXCERPT_LENGTH = 160

export type Locale = 'nl' | 'en'

/** Ruw item zoals Cockpit het teruggeeft (na locale-resolutie door Cockpit zelf). */
interface CmsAsset {
  _id: string
  path: string
  title?: string
  mime?: string
  width?: number
  height?: number
}

interface CmsItem {
  _id: string
  title?: string
  slug?: string
  date?: string
  intro?: string
  content?: string
  image?: CmsAsset | null
  imageAlt?: string
  _modified?: number
  _created?: number
}

export interface ArticleImage {
  url: string
  alt: string
  width?: number
  height?: number
}

export interface Article {
  id: string
  slug: string
  locale: Locale
  /** Waar: de EN-versie ontbreekt en de NL-tekst wordt getoond. */
  isFallback: boolean
  title: string
  /** Publicatiedatum (uit het CMS-datumveld), altijd 12:00 UTC om tijdzone-verschuiving te vermijden. */
  date: Date
  intro: string
  /** Gesanitizede HTML, veilig voor dangerouslySetInnerHTML. */
  body: string
  excerpt: string
  readingMinutes: number
  image: ArticleImage | null
  updatedAt: Date
}

const SLUG_PATTERN = /^[a-z0-9-]+$/

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug)
}

export function cmsBaseUrl(): string {
  let url = process.env.CMS_BASE_URL?.trim() || CMS_DEFAULT_BASE_URL
  while (url.endsWith('/')) url = url.slice(0, -1)
  return url
}

function uploadsBaseUrl(): string {
  return `${cmsBaseUrl()}/storage/uploads`
}

function assetUrl(asset: CmsAsset): string {
  const path = asset.path.startsWith('/') ? asset.path : `/${asset.path}`
  return `${uploadsBaseUrl()}${path}`
}

// --- Ophalen ----------------------------------------------------------------

async function fetchItems(cockpitLocale: 'default' | 'en'): Promise<CmsItem[] | null> {
  const apiKey = process.env.CMS_API_KEY?.trim()

  if (!apiKey) {
    console.warn('[cms] CMS_API_KEY ontbreekt; /over toont geen artikelen.')
    return null
  }

  const params = new URLSearchParams({
    locale: cockpitLocale,
    sort: JSON.stringify({ date: -1 }),
  })
  const url = `${cmsBaseUrl()}/api/content/items/${CMS_MODEL}?${params.toString()}`

  try {
    const res = await fetch(url, {
      headers: { 'api-key': apiKey, Accept: 'application/json' },
      next: { revalidate: CMS_REVALIDATE_SECONDS, tags: [CMS_CACHE_TAG] },
    })

    if (!res.ok) {
      console.error(`[cms] ${url} gaf HTTP ${res.status}`)
      return null
    }

    const data: unknown = await res.json()
    return Array.isArray(data) ? (data as CmsItem[]) : null
  } catch (error) {
    console.error(`[cms] ophalen van ${url} mislukt`, error)
    return null
  }
}

// --- Omzetten ----------------------------------------------------------------

function stripTags(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function excerptOf(intro: string, body: string): string {
  const source = intro.trim() || decodeEntities(stripTags(body))
  if (source.length <= EXCERPT_LENGTH) return source
  const cut = source.slice(0, EXCERPT_LENGTH)
  let head = cut.slice(0, Math.max(cut.lastIndexOf(' '), 0))
  while (head.length && ' .,;:!-\n\t'.includes(head.at(-1) ?? '')) head = head.slice(0, -1)
  return `${head}…`
}

function readingMinutesOf(...texts: string[]): number {
  const words = texts
    .map(decodeEntities)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

function parseDate(value: string | undefined, fallbackSeconds?: number): Date {
  if (value && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(`${value.slice(0, 10)}T12:00:00Z`)
  }
  return fallbackSeconds ? new Date(fallbackSeconds * 1000) : new Date(0)
}

/**
 * Alleen tekst-opmaak en afbeeldingen uit het CMS zelf komen door. Scripts, iframes,
 * inline styles en externe afbeeldingen niet.
 */
function sanitizeBody(html: string): string {
  const uploads = uploadsBaseUrl()

  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'strong', 'b', 'em', 'i', 'u', 's',
      'blockquote', 'img', 'figure', 'figcaption', 'br', 'hr', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? ''
        const external = /^https?:\/\//i.test(href) && !href.startsWith('https://rolodink.app')
        return {
          tagName,
          attribs: external
            ? { ...attribs, target: '_blank', rel: 'noreferrer' }
            : attribs,
        }
      },
      img: (tagName, attribs) => {
        let src = attribs.src ?? ''
        if (src.startsWith('/storage/uploads/')) {
          src = `${cmsBaseUrl()}${src}`
        }
        return {
          tagName,
          attribs: { ...attribs, src, loading: 'lazy' },
        }
      },
    },
    exclusiveFilter: (frame) =>
      frame.tag === 'img' && !(frame.attribs.src ?? '').startsWith(`${uploads}/`),
  })
}

function toArticle(item: CmsItem, locale: Locale, isFallback: boolean): Article | null {
  const slug = item.slug?.trim() ?? ''
  const title = item.title?.trim() ?? ''

  if (!isValidSlug(slug) || !title) {
    return null
  }

  const intro = (item.intro ?? '').trim()
  const body = sanitizeBody(item.content ?? '')
  const bodyText = stripTags(body)

  const image: ArticleImage | null =
    item.image?.path
      ? {
          url: assetUrl(item.image),
          alt: (item.imageAlt ?? item.image.title ?? '').trim(),
          width: item.image.width,
          height: item.image.height,
        }
      : null

  return {
    id: item._id,
    slug,
    locale,
    isFallback,
    title,
    date: parseDate(item.date, item._created),
    intro,
    body,
    excerpt: excerptOf(intro, body),
    readingMinutes: readingMinutesOf(intro, bodyText),
    image,
    updatedAt: item._modified ? new Date(item._modified * 1000) : new Date(0),
  }
}

// --- Publieke API ------------------------------------------------------------

/**
 * Alle gepubliceerde artikelen voor een taal, nieuwste eerst.
 * Bij een storing van het CMS: lege lijst (de site blijft werken).
 */
export async function getArticles(locale: Locale): Promise<Article[]> {
  const defaults = await fetchItems('default')
  if (!defaults) return []

  if (locale === 'nl') {
    return defaults
      .map((item) => toArticle(item, 'nl', false))
      .filter((a): a is Article => a !== null)
  }

  // Cockpit vult bij locale=en ontbrekende EN-velden met de NL-waarde en verwijdert
  // daarna de _en-sleutels. Door beide antwoorden te vergelijken zien we of er echt
  // een Engelse tekst is.
  const english = (await fetchItems('en')) ?? []
  const englishById = new Map(english.map((item) => [item._id, item]))

  return defaults
    .map((item) => {
      const en = englishById.get(item._id) ?? item
      const isFallback = (en.content ?? '') === (item.content ?? '')
      return toArticle(en, 'en', isFallback)
    })
    .filter((a): a is Article => a !== null)
}

export async function getArticle(slug: string, locale: Locale): Promise<Article | null> {
  if (!isValidSlug(slug)) return null
  const articles = await getArticles(locale)
  return articles.find((article) => article.slug === slug) ?? null
}

/** Voor de sitemap: slugs met laatste wijziging, taalonafhankelijk. */
export async function getArticleSummaries(): Promise<Array<{ slug: string; updatedAt: Date }>> {
  const articles = await getArticles('nl')
  return articles.map(({ slug, updatedAt }) => ({ slug, updatedAt }))
}
