import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Help',
  description: 'Hulp, veelgestelde vragen en troubleshooting voor Rolodink.',
}

export default function HelpPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Hulp & Veelgestelde vragen
            </h1>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Problemen met installatie of gebruik? Hieronder vind je de meest voorkomende oplossingen.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto grid justify-center gap-6 md:max-w-[64rem]">
            <Card>
              <CardHeader>
                <CardTitle>Installatie</CardTitle>
                <CardDescription>
                  De extensie installeren vanuit de Chrome Web Store.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>1. Ga naar de <Link href="/download" className="text-primary underline">download</Link> pagina en klik op Add to Chrome.</p>
                <p>2. Bevestig in de Chrome Web Store.</p>
                <p>3. Open LinkedIn en bezoek een profiel.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>De knop verschijnt niet op LinkedIn</CardTitle>
                <CardDescription>
                  Veel LinkedIn-pagina's laden dynamisch (SPA).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  <li>Ververs de pagina (Ctrl/Cmd + R) op het profiel.</li>
                  <li>Wacht 1–2 seconden na het laden; de knop wordt pas na de profiel-CTA's toegevoegd.</li>
                  <li>Controleer of content blockers (uBlock, adblockers) uit staan voor linkedin.com.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  Welke rechten gebruikt Rolodink?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>LinkedIn toegang</strong> om de knop te tonen.</li>
                  <li><strong>Storage</strong> voor lokale instellingen/UI.</li>
                  <li>Geen tracking, geen dataverkoop. Zie ook <Link href="/privacy" className="text-primary underline">privacy</Link>.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Foutmeldingen bij toevoegen</CardTitle>
                <CardDescription>
                  Algemene tips bij een fout tijdens het opslaan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  <li>Controleer je internetverbinding.</li>
                  <li>Probeer het opnieuw op een ander profiel.</li>
                  <li>Open de browser console (F12) en kijk of er een duidelijke melding staat.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
                <CardDescription>
                  Hulp nodig? Neem contact op.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>E‑mail: <a href="mailto:hello@rolodink.app" className="text-primary underline">hello@rolodink.app</a></p>
                <div className="flex gap-3">
                  <Button asChild size="sm"><Link href="/download">Download</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link href="/how-it-works">Hoe werkt het?</Link></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}


