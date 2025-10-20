import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { pageSEO } from "@/lib/seo";

export const metadata = {
  title: pageSEO.terms.title,
  description: pageSEO.terms.description,
};

export default function TermsPage() {
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
            Gebruiksvoorwaarden
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
            <h2>1. Acceptatie van de Voorwaarden</h2>
            <p>
              Door de Rolodink Chrome Extensie en website (de &quot;Dienst&quot;)
              te gebruiken, gaat u akkoord met deze Gebruiksvoorwaarden. Als u
              niet akkoord gaat met deze voorwaarden, dient u de Dienst niet te
              gebruiken.
            </p>

            <h2>2. Gebruik van de Dienst</h2>
            <p>
              U stemt ermee in de Dienst alleen te gebruiken voor legitieme
              doeleinden. U bent verantwoordelijk voor alle data en notities die
              u via de Dienst opslaat. Het is verboden de Dienst te gebruiken
              voor illegale activiteiten of op een manier die de werking van de
              Dienst kan schaden.
            </p>

            <h2>3. Intellectueel Eigendom</h2>
            <p>
              De Dienst en alle bijbehorende materialen, inclusief maar niet
              beperkt tot software, logo&apos;s en ontwerpen, zijn het exclusieve
              eigendom van Rolodink. U mag geen enkel deel van de Dienst
              kopiëren, wijzigen of distribueren zonder onze uitdrukkelijke
              schriftelijke toestemming.
            </p>

            <h2>4. Beëindiging</h2>
            <p>
              Wij behouden ons het recht voor om uw toegang tot de Dienst op elk
              moment, zonder voorafgaande kennisgeving, op te schorten of te
              beëindigen als u deze voorwaarden schendt.
            </p>

            <h2>5. Vrijwaring van Garantie</h2>
            <p>
              De Dienst wordt geleverd &quot;as is&quot;, zonder enige vorm van
              garantie, expliciet of impliciet. Wij garanderen niet dat de
              Dienst ononderbroken, veilig of vrij van fouten zal zijn.
            </p>

            <h2>6. Beperking van Aansprakelijkheid</h2>
            <p>
              In geen geval zal Rolodink aansprakelijk zijn voor enige indirecte,
              incidentele, speciale, of gevolgschade die voortvloeit uit of in
              verband met uw gebruik van de Dienst.
            </p>

            <h2>7. Wijzigingen in de Voorwaarden</h2>
            <p>
              We kunnen deze Gebruiksvoorwaarden van tijd tot tijd bijwerken. We
              zullen u op de hoogte stellen van eventuele wijzigingen door de
              nieuwe voorwaarden op deze pagina te publiceren.
            </p>

            <h2>8. Contact</h2>
            <p>
              Als u vragen heeft over deze Gebruiksvoorwaarden, kunt u contact
              met ons opnemen via e-mail op{" "}
              <a href="mailto:hallo@rolodink.app">hallo@rolodink.app</a>.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}