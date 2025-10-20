import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, User, Edit3, Search, type LucideIcon } from "lucide-react";
import { pageSEO } from "@/lib/seo";

export const metadata = {
  title: pageSEO.howItWorks.title,
  description: pageSEO.howItWorks.description,
};

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: Download,
    title: "Installeer de Extensie",
    description: "Voeg Rolodink met één klik toe aan je Chrome browser vanuit de Web Store. De installatie duurt minder dan 30 seconden.",
  },
  {
    icon: User,
    title: "Open een LinkedIn Profiel",
    description: "Navigeer naar het profiel van een van je connecties. Rolodink verschijnt automatisch aan de zijkant van de pagina.",
  },
  {
    icon: Edit3,
    title: "Voeg je Notities Toe",
    description: "Noteer waar je iemand hebt ontmoet, waarover jullie spraken, of wat je ook maar wilt onthouden. Jouw notities zijn 100% privé.",
  },
  {
    icon: Search,
    title: "Vind Alles Direct Terug",
    description: "Gebruik de zoekbalk in de extensie om je netwerk te doorzoeken op basis van de inhoud van je notities en tags.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container max-w-4xl py-16 text-center md:py-24 lg:py-32">
          <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl lg:text-6xl">
            Van Chaos naar Connectie in 4 Stappen
          </h1>
          <p className="mt-6 text-lg leading-8 text-grey sm:text-xl">
            Rolodink is ontworpen om naadloos in je workflow te passen. Geen ingewikkelde software, gewoon een simpele tool die doet wat het moet doen.
          </p>
        </section>

        {/* Step-by-step Section */}
        <section className="container max-w-6xl pb-16 md:pb-24 lg:pb-32">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <Card key={step.title} className="relative flex flex-col text-center border-azure/10">
                <CardHeader>
                  <Badge
                    variant="outline"
                    className="absolute -top-4 left-1/2 -translate-x-1/2 border-gold bg-background px-3 py-1 text-sm font-semibold text-gold"
                  >
                    Stap {index + 1}
                  </Badge>
                  <div className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-azure/5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-azure/10 text-azure">
                      <step.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="mb-2 font-playfair text-xl text-azure">{step.title}</CardTitle>
                  <p className="text-sm leading-6 text-grey">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-azure/5">
          <div className="container max-w-4xl py-16 text-center md:py-24">
            <h2 className="font-playfair text-3xl font-bold tracking-tight text-azure sm:text-4xl">
              Klaar om je netwerk te organiseren?
            </h2>
            <p className="mt-4 text-lg leading-8 text-grey">
              Het kost minder dan een minuut om te beginnen.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <a href={process.env.NEXT_PUBLIC_EXTENSION_URL} target="_blank" rel="noreferrer">
                  Add to Chrome - Gratis
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}