import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { pageSEO } from '@/lib/seo'

export const metadata = {
  title: pageSEO.terms.title,
  description: pageSEO.terms.description,
}

export default function TermsPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1">
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-4 text-center">
              <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                Algemene Voorwaarden
              </h1>
              <p className="text-muted-foreground">
                Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Gebruiksvoorwaarden voor Rolodink</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">1. Aanvaarding van voorwaarden</h3>
                  <p className="text-muted-foreground">
                    Door Rolodink te installeren en te gebruiken, ga je akkoord met deze algemene voorwaarden. 
                    Als je niet akkoord gaat, installeer en gebruik Rolodink dan niet.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">2. Beschrijving van de service</h3>
                  <p className="text-muted-foreground">
                    Rolodink is een browserextensie om notities bij LinkedIn‑profielen op te slaan. 
                    Notities en, indien je registreert/inlogt, minimale accountgegevens worden veilig 
                    opgeslagen in een externe database (Supabase). De API wordt gehost op Vercel. 
                    Synchronisatie maakt je notities beschikbaar op meerdere apparaten. 
                    Zie ons{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacybeleid
                    </Link>{' '}
                    voor details over dataverwerking en opslag.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">3. Gebruik van de extensie</h3>
                  <p className="text-muted-foreground">
                    Je mag Rolodink gebruiken voor persoonlijke en professionele doeleinden. 
                    Je mag de extensie niet gebruiken voor:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Illegale activiteiten</li>
                    <li>Spam of ongewenste communicatie</li>
                    <li>Het schenden van LinkedIn's gebruiksvoorwaarden</li>
                    <li>Het verzamelen van data voor commerciële doeleinden zonder toestemming</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">4. Privacy en data</h3>
                  <p className="text-muted-foreground">
                    Rolodink respecteert je privacy. We verwerken minimale accountgegevens en notities 
                    om de synchronisatieservice te bieden. Zie het{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacybeleid
                    </Link>{' '}
                    voor welke data wij verwerken, opslaglocaties, analytics en jouw rechten.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">5. Intellectueel eigendom</h3>
                  <p className="text-muted-foreground">
                    Rolodink is open source software onder de MIT-licentie. De code is beschikbaar op{' '}
                    <Link 
                      href="https://github.com/thijsmat/rolodink" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      GitHub
                    </Link>
                    . Je eigen notities blijven jouw eigendom.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">6. Beschikbaarheid</h3>
                  <p className="text-muted-foreground">
                    We streven ernaar Rolodink beschikbaar te houden, maar kunnen geen garantie geven 
                    over de continuïteit van de service. Updates kunnen op elk moment beschikbaar komen.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">7. Aansprakelijkheid</h3>
                  <p className="text-muted-foreground">
                    Rolodink wordt geleverd "zoals het is". We zijn niet aansprakelijk voor:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Verlies van data door browser crashes of extensie problemen</li>
                    <li>Schade door gebruik van de extensie</li>
                    <li>Problemen met LinkedIn's platform of API wijzigingen</li>
                  </ul>
                  <p className="text-muted-foreground">
                    We raden aan om regelmatig backups te maken van je belangrijke notities.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">8. Jouw rechten</h3>
                  <p className="text-muted-foreground">
                    Je hebt het recht om jouw data te exporteren of te verwijderen. 
                    Neem contact op met ons ondersteuningsteam via{' '}
                    <Link 
                      href="mailto:hello@rolodink.app" 
                      className="text-primary hover:underline"
                    >
                      hello@rolodink.app
                    </Link>{' '}
                    om dit te regelen. Zie het{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacybeleid
                    </Link>{' '}
                    voor meer details over jouw rechten.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">9. Wijzigingen aan voorwaarden</h3>
                  <p className="text-muted-foreground">
                    We kunnen deze voorwaarden op elk moment wijzigen. Belangrijke wijzigingen 
                    worden gecommuniceerd via de extensie of onze website.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">10. Beëindiging</h3>
                  <p className="text-muted-foreground">
                    Je kunt Rolodink op elk moment verwijderen uit je browser. 
                    We kunnen de service ook beëindigen zonder voorafgaande kennisgeving.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">11. Toepasselijk recht</h3>
                  <p className="text-muted-foreground">
                    Deze voorwaarden worden beheerst door Nederlands recht. 
                    Geschillen worden voorgelegd aan de bevoegde Nederlandse rechtbank.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">12. Contact</h3>
                  <p className="text-muted-foreground">
                    Vragen over deze voorwaarden? Neem contact op via{' '}
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
                  <h3 className="text-xl font-semibold">13. Open source licentie</h3>
                  <p className="text-muted-foreground">
                    Rolodink is open source software onder de MIT-licentie. De volledige licentie is beschikbaar op{' '}
                    <Link 
                      href="https://github.com/thijsmat/rolodink" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      GitHub
                    </Link>
                    .
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
