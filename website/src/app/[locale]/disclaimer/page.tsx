"use client";

import { SiteFooter } from '@/components/site-footer'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl';

export default function DisclaimerPage() {
  const t = useTranslations('DisclaimerPage');

  const lastUpdated = new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <main className="flex-1 pt-16">
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">{t('title')}</h1>
            <p className="text-muted-foreground">{t('lastUpdated')}: {lastUpdated}</p>
            <p className="text-muted-foreground">
              {t('content')}
            </p>
            <p className="text-muted-foreground">
              {t.rich('links', {
                privacy: (chunks) => <Link href="/privacy" className="text-primary hover:underline">{chunks}</Link>,
                terms: (chunks) => <Link href="/terms" className="text-primary hover:underline">{chunks}</Link>
              })}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
