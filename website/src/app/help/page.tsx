import { SiteFooter } from "@/components/site-footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { pageSEO } from "@/lib/seo";

export const metadata = {
  title: "Help & Support",
  description: "Vind antwoorden op veelgestelde vragen en krijg hulp bij het gebruik van Rolodink.",
};

const faqItems = [
  {
    question: "Hoe installeer ik Rolodink?",
    answer:
      "Rolodink is een Chrome Extensie. Je kunt het met één klik toevoegen vanuit de Chrome Web Store. Na de installatie is het direct actief op de LinkedIn website. Zorg ervoor dat je de pagina ververst als je de zijbalk niet direct ziet.",
  },
  {
    question: "Is Rolodink echt gratis?",
    answer:
      "Ja, de kernfunctionaliteit van Rolodink is volledig gratis. We willen dat iedereen de mogelijkheid heeft om zijn netwerk beter te beheren. In de toekomst kunnen er premium features komen voor power-users, maar de basis blijft gratis.",
  },
  {
    question: "Waar worden mijn notities opgeslagen?",
    answer:
      "Je notities worden veilig opgeslagen in de cloud, gekoppeld aan jouw account. Ze zijn privé en alleen voor jou zichtbaar. We nemen privacy zeer serieus en verkopen je data nooit. Lees onze Privacy Policy voor meer details.",
  },
  {
    question: "Werkt Rolodink ook op de mobiele LinkedIn app?",
    answer:
      "Momenteel werkt Rolodink alleen als Chrome Extensie op desktop computers. Een mobiele oplossing staat op onze roadmap voor de toekomst.",
  },
  {
    question: "Ik zie de Rolodink zijbalk niet op LinkedIn. Wat nu?",
    answer:
      "Probeer de LinkedIn pagina te verversen. Als dat niet werkt, controleer dan of de extensie is ingeschakeld via het puzzelstuk-icoon in je Chrome-werkbalk. Neem contact op als het probleem aanhoudt.",
  },
  {
    question: "Kan ik mijn data exporteren?",
    answer:
      "Deze functionaliteit is momenteel in ontwikkeling. We begrijpen het belang van data-eigendom en werken aan een optie om al je notities en contactgegevens te kunnen exporteren.",
  },
];

export default function HelpPage() {
  return (
    <>
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="container max-w-4xl py-16 text-center md:py-24 lg:py-32">
          <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl lg:text-6xl">
            Hulp & Veelgestelde Vragen
            </h1>
          <p className="mt-6 text-lg leading-8 text-grey sm:text-xl">
            Vind hier de antwoorden op de meest voorkomende vragen. Staat je vraag er niet bij? Neem gerust contact op.
            </p>
        </section>

        {/* FAQ Accordion Section */}
        <section className="container max-w-3xl pb-16 md:pb-24 lg:pb-32">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger className="text-left font-playfair text-lg text-azure hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-grey">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Final CTA */}
        <section className="bg-azure/5">
          <div className="container max-w-4xl py-16 text-center md:py-24">
            <h2 className="font-playfair text-3xl font-bold tracking-tight text-azure sm:text-4xl">
              Nog steeds vragen?
            </h2>
            <p className="mt-4 text-lg leading-8 text-grey">
              De beste manier om Rolodink te begrijpen is door het zelf te proberen.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <a href={process.env.NEXT_PUBLIC_EXTENSION_URL} target="_blank" rel="noreferrer">
                  Probeer het Gratis
                </a>
              </Button>
                </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}