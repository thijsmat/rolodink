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
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-muted-foreground">
              Rolodink is an independent product and is not affiliated with, endorsed by, or in any way associated with LinkedIn Corporation or Rolodex Corporation. LinkedIn is a trademark of LinkedIn Corporation. Rolodex is a trademark of Newell Brands. Rolodink is a portmanteau of 'Rolodex' and 'LinkedIn' describing our functionality, and does not imply any official relationship with these brands.
            </p>
            <p className="text-muted-foreground">
              Also see our{' '}<Link href="/en/privacy" className="text-primary hover:underline">Privacy Policy</Link>{' '}and{' '}<Link href="/en/terms" className="text-primary hover:underline">Terms</Link>.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}


