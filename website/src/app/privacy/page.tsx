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
                Privacybeleid Rolodink
              </h1>
              <p className="text-muted-foreground">Laatst bijgewerkt: 14 oktober 2025</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Privacy is onze prioriteit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Rolodink is een browserextensie die je helpt persoonlijke notities te maken bij LinkedIn-profielen. 
                    Wij geloven dat jouw data van jou is en dat jij altijd volledige controle moet hebben over je informatie.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Welke data verzamelen wij?</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>Geen persoonlijke data:</strong> we verzamelen geen informatie over jou, je LinkedIn-profiel of je notities.</li>
                    <li><strong>Lokale opslag:</strong> alle notities worden uitsluitend lokaal in jouw browser opgeslagen; er wordt geen data naar externe servers gestuurd.</li>
                    <li><strong>Geen tracking:</strong> we gebruiken geen tracking, analytics of cookies voor gebruikersmonitoring.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Toestemmingen en toegang</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>ActiveTab:</strong> nodig om de knop “Voeg notitie toe” te tonen; alleen na gebruikersinteractie en tijdelijk.</li>
                    <li><strong>Hostrechten:</strong> alleen toegang tot linkedin.com-pagina’s tijdens gebruik van de extensie.</li>
                    <li><strong>Scripting:</strong> scripts worden alleen geïnjecteerd in LinkedIn-pagina’s na actie van de gebruiker.</li>
                    <li><strong>Storage:</strong> browseropslag om notities en instellingen lokaal te bewaren.</li>
                    <li><strong>Tabs:</strong> leest tabinformatie om functies uit te voeren bij gebruikersacties; er wordt geen data verzameld.</li>
                    <li><strong>Externe code:</strong> gebruik van open source libraries die veilig worden geladen en geen gebruikersgegevens delen.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Beveiliging van jouw data</h3>
                  <p className="text-muted-foreground">
                    We maken gebruik van de beveiligingsvoorzieningen van moderne browsers, zoals sandboxing en encryptie van lokale opslag, om je notities veilig en privé te houden.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Jouw rechten</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Je kunt de extensie verwijderen om alle opgeslagen data te wissen.</li>
                    <li>Je kunt jouw data exporteren via de browserinstellingen.</li>
                    <li>Je kunt je data inzien via ontwikkelaarstools in je browser.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Derde partijen</h3>
                  <p className="text-muted-foreground">
                    Rolodink deelt geen gegevens met derden. Voor extensie-updates worden alleen de officiële Chrome Web Store-servers gebruikt.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Wijzigingen in het privacybeleid</h3>
                  <p className="text-muted-foreground">
                    Wijzigingen in dit beleid communiceren we via update-notificaties in de extensie. We raden aan om het beleid regelmatig te controleren.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Contact</h3>
                  <p className="text-muted-foreground">
                    Heb je vragen of opmerkingen over privacy? Neem contact op via: <Link href="mailto:hello@rolodink.app" className="text-primary hover:underline">hello@rolodink.app</Link>
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
