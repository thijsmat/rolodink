import { getTranslations } from 'next-intl/server'
import { Check, ChevronDown, Info } from 'lucide-react'
import { Link } from '@/navigation'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/json-ld'
import { NoteCard } from '@/components/note-card'
import { SiteFooter } from '@/components/site-footer'
import { StoreCtaBand } from '@/components/store-cta-band'
import { LANDING_PAGES, type LandingKey } from '@/lib/landing'
import { BASE_URL, PAGE_PATHS } from '@/lib/seo'
import { storeUrl } from '@/lib/utils'

type Item = { title: string; description: string }

// The shape of a `Landing.<key>` message block.
type Content = {
  eyebrow: string
  title: string
  intro: string
  steps: Item[]
  benefits: Item[]
  limits: string[]
  privacy: string
  faq: { question: string; answer: string }[]
}

type Common = {
  stepsTitle: string
  exampleTitle: string
  exampleLabel: string
  benefitsTitle: string
  limitsTitle: string
  privacyTitle: string
  privacyLink: string
  faqTitle: string
  relatedTitle: string
  breadcrumbHome: string
  primaryCta: string
  secondaryCta: string
  otherBrowsers: string
  ctaTitle: string
  ctaDescription: string
  related: Record<LandingKey, Item>
}

const SECTION = 'container mx-auto max-w-5xl px-4 py-12 md:py-16'
const H2 = 'font-playfair text-3xl font-bold tracking-tight text-azure sm:text-4xl'

/**
 * One SEO landing page (/linkedin-notes-extension and /use-cases/*). The texts live in the
 * `Landing` messages; the page's title and description in `PageMeta` (see lib/seo.ts).
 */
export async function LandingPage({ locale, page }: Readonly<{ locale: string; page: LandingKey }>) {
  const t = await getTranslations({ locale, namespace: 'Landing' })
  const examples = await getTranslations({ locale, namespace: 'Examples' })
  const content = t.raw(page) as Content
  const common = t.raw('common') as Common

  const { meta, example } = LANDING_PAGES[page]
  const url = `${BASE_URL}/${locale}${PAGE_PATHS[meta]}`
  const otherPages = (Object.keys(LANDING_PAGES) as LandingKey[]).filter((key) => key !== page)

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: common.breadcrumbHome, item: `${BASE_URL}/${locale}` },
          { '@type': 'ListItem', position: 2, name: common.related[page].title, item: url },
        ],
      },
      {
        '@type': 'FAQPage',
        inLanguage: locale,
        mainEntity: content.faq.map((entry) => ({
          '@type': 'Question',
          name: entry.question,
          acceptedAnswer: { '@type': 'Answer', text: entry.answer },
        })),
      },
    ],
  }

  return (
    <>
      <JsonLd data={structuredData} />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="container mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{content.eyebrow}</p>
          <h1 className="mt-4 font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl lg:text-6xl">
            {content.title}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-grey sm:text-xl/8">{content.intro}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <a href={storeUrl('chrome', 'landing')} target="_blank" rel="noreferrer">
                {common.primaryCta}
              </a>
            </Button>
            <Link href="/how-it-works" className="font-medium text-link-blue hover:underline">
              {common.secondaryCta}
            </Link>
          </div>
          <p className="mt-4 text-sm text-grey">
            <Link href="/download" className="hover:underline">
              {common.otherBrowsers}
            </Link>
          </p>
        </section>

        {/* Steps */}
        <section className={SECTION}>
          <h2 className={`${H2} text-center`}>{common.stepsTitle}</h2>
          <ol className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
            {content.steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="w-12 shrink-0 whitespace-nowrap font-playfair text-3xl font-semibold leading-none text-gold">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-azure">{step.title}</h3>
                  <p className="mt-1 leading-relaxed text-grey">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Example note */}
        <section className={SECTION}>
          <div className="mx-auto max-w-2xl">
            <h2 className={`${H2} text-center`}>{common.exampleTitle}</h2>
            <p className="mt-3 text-center text-xs uppercase tracking-wide text-grey/80">{common.exampleLabel}</p>
            <div className="mt-8">
              <NoteCard
                situation={examples(`items.${example}.situation`)}
                role={examples(`items.${example}.role`)}
                notes={examples.raw(`items.${example}.notes`) as string[]}
                findWith={examples('findWith')}
                query={examples(`items.${example}.query`)}
              />
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className={SECTION}>
          <h2 className={`${H2} text-center`}>{common.benefitsTitle}</h2>
          <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {content.benefits.map((benefit) => (
              <li key={benefit.title} className="flex gap-3 rounded-2xl border border-azure/10 bg-white p-6">
                <Check className="mt-1 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-azure">{benefit.title}</h3>
                  <p className="mt-1 leading-relaxed text-grey">{benefit.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Limits, said plainly */}
        <section className={SECTION}>
          <div className="mx-auto max-w-3xl rounded-2xl bg-azure/5 p-6 md:p-8">
            <h2 className="font-playfair text-2xl font-bold text-azure">{common.limitsTitle}</h2>
            <ul className="mt-4 space-y-3">
              {content.limits.map((limit) => (
                <li key={limit} className="flex gap-3 leading-relaxed text-grey">
                  <Info className="mt-1 h-4 w-4 shrink-0 text-azure" aria-hidden="true" />
                  <span>{limit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Privacy */}
        <section className={SECTION}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className={H2}>{common.privacyTitle}</h2>
            <p className="mt-4 text-lg leading-8 text-grey">{content.privacy}</p>
            <p className="mt-4">
              <Link href="/security" className="font-medium text-link-blue hover:underline">
                {common.privacyLink}
              </Link>
            </p>
          </div>
        </section>

        {/* FAQ: <details>, so the answers are in the HTML without any script */}
        <section className={SECTION}>
          <div className="mx-auto max-w-3xl">
            <h2 className={`${H2} text-center`}>{common.faqTitle}</h2>
            <div className="mt-8 space-y-3">
              {content.faq.map((entry) => (
                <details key={entry.question} className="group rounded-2xl border border-azure/10 bg-white shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-azure">
                    {entry.question}
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-neutral-500 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="border-t border-azure/10 px-5 pb-5 pt-4 leading-relaxed text-grey">{entry.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Related pages */}
        <nav aria-label={common.relatedTitle} className={SECTION}>
          <h2 className={`${H2} text-center`}>{common.relatedTitle}</h2>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {otherPages.map((key) => (
              <li key={key}>
                <Link
                  href={PAGE_PATHS[LANDING_PAGES[key].meta]}
                  className="block h-full rounded-2xl border border-azure/10 bg-white p-5 transition-colors hover:bg-azure/5"
                >
                  <span className="font-semibold text-azure">{common.related[key].title}</span>
                  <span className="mt-1 block text-sm text-grey">{common.related[key].description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <StoreCtaBand
          title={common.ctaTitle}
          description={common.ctaDescription}
          button={common.primaryCta}
          placement="landing"
        />
      </main>
      <SiteFooter />
    </>
  )
}
