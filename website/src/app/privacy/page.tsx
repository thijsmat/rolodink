import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { pageSEO } from '@/lib/seo'

export const metadata = {
  title: pageSEO.privacy.title,
  description: pageSEO.privacy.description,
}

export default function PrivacyPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1">
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-4 text-center">
              <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                Privacybeleid
              </h1>
              <p className="text-muted-foreground">
                Laatste update: {new Date().toLocaleDateString('nl-NL')}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Privacy is onze prioriteit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Wat is Rolodink?</h3>
                  <p className="text-muted-foreground">
                    Rolodink is een browser extensie die je helpt notities te maken bij LinkedIn profielen. 
                    We geloven dat je data van jou is en dat je volledige controle moet hebben over je informatie.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Welke data verzamelen we?</h3>
                  <p className="text-muted-foreground">
                    <strong>Geen persoonlijke data.</strong> Rolodink verzamelt geen informatie over jou, 
                    je LinkedIn profiel, of je notities. Alles wordt lokaal opgeslagen in je browser.
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Je notities worden alleen opgeslagen in je browser</li>
                    <li>Geen data wordt naar onze servers gestuurd</li>
                    <li>Geen tracking of analytics</li>
                    <li>Geen cookies voor tracking</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Technische informatie</h3>
                  <p className="text-muted-foreground">
                    Voor de werking van de extensie hebben we minimale technische rechten nodig:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>LinkedIn toegang:</strong> Om de "Voeg toe aan CRM" knop te tonen</li>
                    <li><strong>Lokale opslag:</strong> Om je notities op te slaan in je browser</li>
                    <li><strong>Geen netwerk toegang:</strong> Voor je notities (alleen voor updates)</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Hoe beschermen we je privacy?</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>Lokale opslag:</strong> Alle data blijft in je browser</li>
                    <li><strong>Open source:</strong> Code is openbaar en controleerbaar</li>
                    <li><strong>Geen tracking:</strong> Geen analytics of gebruikersmonitoring</li>
                    <li><strong>Minimale rechten:</strong> Alleen de rechten die nodig zijn voor de functie</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Derde partijen</h3>
                  <p className="text-muted-foreground">
                    Rolodink deelt geen data met derde partijen. De extensie werkt volledig lokaal.
                    Voor updates van de extensie zelf maken we gebruik van de Chrome Web Store.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Je rechten</h3>
                  <p className="text-muted-foreground">
                    Omdat je data lokaal wordt opgeslagen, heb je volledige controle:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Verwijder de extensie om alle data te wissen</li>
                    <li>Exporteer je data via browser instellingen</li>
                    <li>Bekijk je data in browser ontwikkelaarstools</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Contact</h3>
                  <p className="text-muted-foreground">
                    Vragen over privacy? Neem contact op via{' '}
                    <Link 
                      href="https://twitter.com/matthijsgoes" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      Twitter
                    </Link>
                    {' '}of{' '}
                    <Link 
                      href="mailto:hello@rolodink.app" 
                      className="text-primary hover:underline"
                    >
                      hello@rolodink.app
                    </Link>
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Wijzigingen</h3>
                  <p className="text-muted-foreground">
                    Dit privacybeleid kan worden bijgewerkt. Belangrijke wijzigingen worden 
                    gecommuniceerd via de extensie update notificaties.
                  </p>
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
