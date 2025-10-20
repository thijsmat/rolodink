import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { pageSEO } from "@/lib/seo";

export const metadata = {
  title: pageSEO.privacy.title,
  description: pageSEO.privacy.description,
};

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Page Header */}
        <section className="container max-w-4xl py-16 text-center md:py-24">
          <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl lg:text-6xl">
            Privacybeleid
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Laatst bijgewerkt: {lastUpdated}
          </p>
        </section>

        {/* Prose Content */}
        <section className="container max-w-3xl pb-16 md:pb-24 lg:pb-32">
          <div
            className="prose prose-lg mx-auto max-w-none 
                       text-grey 
                       prose-headings:font-playfair prose-headings:font-semibold prose-headings:text-azure 
                       prose-a:text-link-blue prose-a:underline-offset-4 hover:prose-a:text-link-blue/80
                       prose-strong:text-azure"
          >
            <h2>1. Introductie</h2>
            <p>
              Welkom bij Rolodink. Wij respecteren uw privacy en zijn toegewijd
              aan het beschermen van uw persoonlijke gegevens. Dit privacybeleid
              legt uit hoe wij uw informatie verzamelen, gebruiken en
              beschermen wanneer u onze Chrome Extensie en website
              (gezamenlijk, de &quot;Dienst&quot;) gebruikt.
            </p>

            <h2>2. Welke data verzamelen we?</h2>
            <p>Wij verzamelen de volgende soorten informatie:</p>
            <ul>
              <li>
                <strong>Accountinformatie:</strong> Wanneer u zich aanmeldt,
                slaan we uw basis-accountgegevens op die nodig zijn om u te
                authenticeren, zoals uw naam en e-mailadres.
              </li>
              <li>
                <strong>Gebruikersdata:</strong> Alle notities, tags en andere
                informatie die u toevoegt aan LinkedIn profielen via onze
                Dienst. Deze data is van u en wordt als strikt vertrouwelijk
                behandeld.
              </li>
              <li>
                <strong>Anonieme Gebruiksstatistieken:</strong> We gebruiken
                Plausible Analytics om geanonimiseerde data te verzamelen over
                het gebruik van onze website om de gebruikerservaring te
                verbeteren. Dit gebeurt zonder cookies en zonder het verzamelen
                van persoonlijke identificeerbare informatie.
              </li>
            </ul>

            <h2>3. Hoe gebruiken we uw data?</h2>
            <p>
              Uw data wordt uitsluitend gebruikt om de functionaliteit van de
              Dienst te leveren. Uw notities en andere gebruikersdata worden
              alleen aan u getoond wanneer u bent ingelogd. Wij zullen uw data
              nooit verkopen, verhuren of delen met derden voor marketingdoeleinden.
            </p>

            <h2>4. Dataopslag en Beveiliging</h2>
            <p>
              Uw data wordt veilig opgeslagen op servers binnen de Europese
              Unie. We nemen redelijke technische en organisatorische
              maatregelen om uw informatie te beschermen tegen verlies, diefstal
              en ongeautoriseerde toegang.
            </p>

            <h2>5. Uw Rechten</h2>
            <p>
              U heeft het recht om uw persoonlijke gegevens in te zien, te
              corrigeren of te verwijderen. U kunt uw notities en andere data
              direct binnen de extensie beheren. Voor een volledig
              verwijderingsverzoek kunt u contact met ons opnemen.
            </p>

            <h2>6. Wijzigingen in dit beleid</h2>
            <p>
              We kunnen dit privacybeleid van tijd tot tijd bijwerken. We zullen
              u op de hoogte stellen van eventuele wijzigingen door het nieuwe
              privacybeleid op deze pagina te publiceren.
            </p>

            <h2>7. Contact</h2>
            <p>
              Als u vragen heeft over dit privacybeleid, kunt u contact met ons
              opnemen via e-mail op{" "}
              <a href="mailto:hallo@rolodink.app">hallo@rolodink.app</a>.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}