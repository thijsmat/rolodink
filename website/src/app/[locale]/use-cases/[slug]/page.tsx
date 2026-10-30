import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LandingPage } from '@/components/landing/landing-page'
import { LANDING_PAGES, landingPageForSlug } from '@/lib/landing'
import { pageMetadata } from '@/lib/seo'

type Params = Promise<{ locale: string; slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const page = landingPageForSlug(slug)
  return page ? pageMetadata(params, LANDING_PAGES[page].meta) : {}
}

export default async function UseCasePage({ params }: Readonly<{ params: Params }>) {
  const { locale, slug } = await params
  const page = landingPageForSlug(slug)
  if (!page) notFound()
  return <LandingPage locale={locale} page={page} />
}
