import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Security - Rolodink",
  description: "Learn about Rolodink's security measures, data protection, and privacy practices.",
};

export default function SecurityPage() {
  const lastUpdated = new Date().toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <main className="flex-1 pt-16">
        <section className="container py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl mb-4">
              Beveiliging
            </h1>
            <p className="text-lg text-grey mb-16">
              Laatst bijgewerkt: {lastUpdated}
            </p>

            <div
              className="prose prose-lg max-w-none 
                         text-grey 
                         prose-headings:font-playfair prose-headings:font-semibold prose-headings:text-azure 
                         prose-a:text-link-blue prose-a:underline-offset-4 hover:prose-a:text-link-blue/80
                         prose-strong:text-azure"
            >
              <h2>Beveiligingsarchitectuur</h2>
              <p>
                Rolodink implementeert meerdere lagen van beveiliging om uw data te
                beschermen en ongeautoriseerde toegang te voorkomen.
              </p>

              <h2>1. Rate Limiting</h2>
              <p>
                Alle API routes zijn beschermd met rate limiting van 100 requests per
                IP per uur. Dit voorkomt misbruik, DDoS-aanvallen en beschermt tegen
                onverwachte kosten.
              </p>

              <h2>2. Row-Level Security (RLS)</h2>
              <p>
                Op database niveau is Row-Level Security ingeschakeld. Dit betekent
                dat gebruikers alleen toegang hebben tot hun eigen data. Zelfs als
                er een beveiligingslek zou zijn, kunnen gebruikers elkaars data niet
                inzien.
              </p>

              <h2>3. Authenticatie</h2>
              <p>
                We gebruiken Supabase OAuth voor veilige authenticatie. Alle
                sessies worden beveiligd met tokens en automatisch verlengd.
              </p>

              <h2>4. Versleuteling</h2>
              <p>
                Alle data wordt versleuteld tijdens transport (HTTPS) en opgeslagen
                in beveiligde databases binnen de Europese Unie. We gebruiken
                industry-standard encryptieprotocollen.
              </p>

              <h2>5. Secret Management</h2>
              <p>
                Alle API keys en secrets worden beheerd via environment variables en
                zijn nooit hardcoded in de codebase. Alle commits worden automatisch
                gescand op gelekt geheime informatie.
              </p>

              <h2>6. Dependency Scanning</h2>
              <p>
                We voeren regelmatig security audits uit op alle dependencies. Bij
                elke deployment wordt automatisch gecontroleerd op bekende
                kwetsbaarheden.
              </p>

              <h2>7. GDPR Compliance</h2>
              <p>
                Rolodink is volledig GDPR-compliant. Gebruikers hebben volledige
                controle over hun data en kunnen deze op elk moment exporteren of
                verwijderen.
              </p>

              <h2>8. Security Best Practices</h2>
              <ul>
                <li>
                  <strong>CORS Whitelisting:</strong> Alleen toegestane origins kunnen
                  API calls maken
                </li>
                <li>
                  <strong>Input Validatie:</strong> Alle gebruikersinput wordt gevalideerd
                  en gesanitized
                </li>
                <li>
                  <strong>Secure Headers:</strong> We gebruiken security headers zoals
                  CSP, HSTS en X-Frame-Options
                </li>
                <li>
                  <strong>Monitoring:</strong> We monitoren continu voor verdachte
                  activiteiten en misbruik
                </li>
              </ul>

              <h2>Security Audit</h2>
              <p>
                Regelmatig voeren we security audits uit om nieuwe kwetsbaarheden te
                identificeren en te verhelpen. Als u een security issue ontdekt,
                neem dan contact met ons op via{" "}
                <a href="mailto:hallo@rolodink.app">hallo@rolodink.app</a>.
              </p>

              <h2>Contact</h2>
              <p>
                Voor vragen over beveiliging kunt u contact met ons opnemen via{" "}
                <a href="mailto:hallo@rolodink.app">hallo@rolodink.app</a>.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

