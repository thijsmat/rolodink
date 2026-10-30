import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'
import { pageMetadata } from '@/lib/seo'

type Params = Promise<{ locale: string }>

export function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return pageMetadata(params, 'linkedinNotes')
}

export default async function LinkedInNotesPage({ params }: Readonly<{ params: Params }>) {
  const { locale } = await params
  return <LandingPage locale={locale} page="notes" />
}
