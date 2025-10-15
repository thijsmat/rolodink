import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export default function DisclaimerPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">Disclaimer</h1>
            <p className="text-muted-foreground">Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-muted-foreground">
              Rolodink is een onafhankelijk product en is niet gelieerd aan, goedgekeurd door, of op enige wijze verbonden met LinkedIn Corporation of Rolodex Corporation. LinkedIn is een handelsmerk van LinkedIn Corporation. Rolodex is een handelsmerk van Newell Brands. Rolodink is een samentrekking van 'Rolodex' en 'LinkedIn' die onze functionaliteit beschrijft, maar impliceert geen officiële relatie met deze merken.
            </p>
            <p className="text-muted-foreground">
              Bekijk ook ons{' '}<Link href="/privacy" className="text-primary hover:underline">Privacybeleid</Link>{' '}en onze{' '}<Link href="/terms" className="text-primary hover:underline">Voorwaarden</Link>.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}


