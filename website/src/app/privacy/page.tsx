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
                    Rolodink is een browserextensie waarmee je persoonlijke notities bij LinkedIn-profielen kunt opslaan. Wij geloven dat jouw data van jou is en dat jij altijd volledige controle moet hebben over je informatie.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Welke data verzamelen wij?</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>Account en notities (extensie):</strong> notities en – indien je registreert/inlogt – minimale accountgegevens worden veilig opgeslagen in een Supabase-database. De API wordt gehost op Vercel.</li>
                    <li><strong>Synchronisatie:</strong> door deze cloudopslag kun je notities terugvinden op meerdere apparaten en na herinstallatie.</li>
                    <li><strong>Technische/gebruiksdata:</strong> geen tracking, profiling of commercieel gebruik van je data; we verzamelen geen gedragsanalyses binnen de extensie.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Toestemmingen en toegang (extensie)</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>activeTab:</strong> tijdelijke toegang na gebruikersinteractie om de notitieknop te tonen.</li>
                    <li><strong>Hostrechten:</strong> alleen linkedin.com tijdens gebruik.</li>
                    <li><strong>Scripting:</strong> alleen op LinkedIn-profielen na actie van de gebruiker.</li>
                    <li><strong>Storage:</strong> notities worden centraal opgeslagen in Supabase; lokale opslag kan gebruikt worden voor instellingen/sessies.</li>
                    <li><strong>Tabs:</strong> gebruikt om de extensie correct te activeren, niet om data te verzamelen.</li>
                    <li><strong>Externe code:</strong> uitsluitend open‑source libraries; geen delen van gebruikersdata.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Beveiliging</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Dataopslag in Supabase met moderne beveiligingsmaatregelen en toegangscontrole.</li>
                    <li>De backend/API draait op Vercel; verbindingen zijn versleuteld.</li>
                    <li>We streven naar naleving van relevante EU‑privacywetgeving.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Website vs. extensie</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>Website (rolodink.app):</strong> we gebruiken privacy‑vriendelijke webanalytics (Plausible en Vercel Web Analytics) om geaggregeerde bezoekstatistieken te meten. Er wordt geen PII geprofileerd of verkocht.</li>
                    <li><strong>Extensie:</strong> geen tracking/analytics binnen de extensie zelf.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Jouw rechten</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Je kunt jouw data exporteren of verwijderen. Neem contact op met ons ondersteuningsteam om dit te regelen totdat een self‑serviceportal beschikbaar is.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Derde partijen</h3>
                  <p className="text-muted-foreground">We delen geen gegevens met adverteerders of andere externe partijen. Infrastructuur: Supabase (database) en Vercel (hosting/deploy).</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Wijzigingen</h3>
                  <p className="text-muted-foreground">Wijzigingen in dit beleid communiceren we via update‑notificaties in de extensie en via deze pagina.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Contact</h3>
                  <p className="text-muted-foreground">E‑mail: <Link href="mailto:hello@rolodink.app" className="text-primary hover:underline">hello@rolodink.app</Link></p>
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
