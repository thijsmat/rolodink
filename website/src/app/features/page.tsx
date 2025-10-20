import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Shield, 
  Zap,
  Target,
  BarChart3,
  CheckCircle
} from 'lucide-react'
import { pageSEO } from '@/lib/seo'

export const metadata = {
  title: pageSEO.features.title,
  description: pageSEO.features.description,
}

const features = [
  {
    icon: Users,
    title: "Onthoud wat telt",
    description: "Dat moment waarop jullie connecteerden, het project waar ze mee bezig waren, hun passie voor zeilboot restauratie.",
    benefits: [
      "Automatische profielherkenning",
      "Persoonlijke notities per contact",
      "Zoeken in je netwerk"
    ]
  },
  {
    icon: MessageSquare,
    title: "De details die het verschil maken",
    description: "Hun hond heet Max, ze verhuizen naar Berlijn, hun startup zoekt nog een CTO.",
    benefits: [
      "Contextuele notities",
      "Gespreksgeschiedenis",
      "Follow-up herinneringen"
    ]
  },
  {
    icon: Calendar,
    title: "Natuurlijke follow-up",
    description: "'Hoi Tom, hoe bevalt het nieuwe kantoor in Amsterdam? En heb je die lead developer al gevonden?'",
    benefits: [
      "Automatische herinneringen",
      "Follow-up templates",
      "Prioriteit instellen"
    ]
  },
  {
    icon: FileText,
    title: "Gestructureerde data",
    description: "Orden je netwerk met tags, bedrijven en topics — gewoon zodat jij het snel terugvindt.",
    benefits: [
      "Categoriseren van contacten",
      "Bedrijfsinformatie opslaan",
      "Zoeken en filteren"
    ]
  },
  {
    icon: Shield,
    title: "Privacy-first",
    description: "Jouw data blijft van jou. Geen advertenties, geen doorverkoop — gewoon veilig en transparant.",
    benefits: [
      "Beveiligde opslag",
      "Geen tracking in de extensie",
      "Volledige controle"
    ]
  },
  {
    icon: Zap,
    title: "Snelle integratie",
    description: "Werkt direct in LinkedIn. Geen extra apps, geen gedoe — je kunt meteen aan de slag.",
    benefits: [
      "One‑click installatie",
      "Direct beschikbaar",
      "Geen training nodig"
    ]
  }
]

export default function FeaturesPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="container max-w-5xl py-16 md:py-24 lg:py-32">
          <div className="mx-auto flex flex-col items-center space-y-6 text-center">
            <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl md:text-6xl">
              Alle Tools voor een Beter Netwerk
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-grey sm:text-xl">
              Rolodink is meer dan alleen een notitie-app. Het is een complete toolkit om je professionele relaties te verdiepen en je netwerkdoelen te bereiken.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container max-w-6xl pb-16 md:pb-24 lg:pb-32">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="flex flex-col border-azure/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-azure text-background">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <CardTitle className="font-playfair text-xl text-azure">{feature.title}</CardTitle>
                  <CardDescription className="text-grey/90">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-start text-sm text-grey">
                        <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-gold" aria-hidden="true" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Stats Section - Restyled */}
        <section className="bg-azure/5 py-16 md:py-24">
          <div className="container max-w-5xl">
            <div className="text-center">
              <h2 className="font-playfair text-3xl font-bold text-azure sm:text-4xl">
              Waarom professionals kiezen voor Rolodink
              </h2>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
              <div className="flex flex-col items-center space-y-2">
                <Target className="h-8 w-8 text-azure" />
                <p className="text-4xl font-bold text-azure">100%</p>
                <p className="text-muted-foreground">Focus op LinkedIn</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <BarChart3 className="h-8 w-8 text-azure" />
                <p className="text-4xl font-bold text-azure">3x</p>
                <p className="text-muted-foreground">Betere Follow-up</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Zap className="h-8 w-8 text-azure" />
                <p className="text-4xl font-bold text-azure">&lt;30s</p>
                <p className="text-muted-foreground">Installatietijd</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container max-w-5xl py-16 md:py-24 lg:py-32">
          <div className="mx-auto flex max-w-3xl flex-col items-center space-y-6 text-center">
            <h2 className="font-playfair text-3xl font-bold text-azure sm:text-4xl">
              Klaar om te beginnen?
            </h2>
            <p className="text-lg leading-8 text-grey">
              Installeer Rolodink vandaag nog en transformeer je LinkedIn netwerk.
            </p>
            <div className="flex gap-4">
              <Button asChild size="lg">
                <a href={process.env.NEXT_PUBLIC_EXTENSION_URL} target="_blank" rel="noreferrer">
                  Add to Chrome - Gratis
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/how-it-works">
                  Bekijk demo
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <SiteFooter />
    </div>
  )
}
