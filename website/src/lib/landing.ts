import type { PageKey } from '@/lib/seo'

/**
 * The SEO landing pages. Each one has a message block under `Landing.<key>`, a title and
 * description under `PageMeta.<meta>`, and an example note from `Examples.items.<example>`.
 */
export const LANDING_PAGES = {
  notes: { meta: 'linkedinNotes', example: 'event' },
  recruiters: { meta: 'useCaseRecruiters', example: 'recruiter' },
  sales: { meta: 'useCaseSales', example: 'sales' },
  events: { meta: 'useCaseEvents', example: 'event' },
} as const satisfies Record<string, { meta: PageKey; example: string }>

export type LandingKey = keyof typeof LANDING_PAGES

/** The slug under /use-cases/ for each use case page. */
export const USE_CASE_SLUGS = {
  recruiters: 'recruiters',
  sales: 'sales',
  'networking-events': 'events',
} as const satisfies Record<string, LandingKey>

export function landingPageForSlug(slug: string): LandingKey | null {
  return Object.hasOwn(USE_CASE_SLUGS, slug)
    ? USE_CASE_SLUGS[slug as keyof typeof USE_CASE_SLUGS]
    : null
}
