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
  BarChart3
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
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Alle features van Rolodink
            </h1>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Ontdek hoe Rolodink je LinkedIn netwerk transformeert in een krachtige, 
              georganiseerde database van waardevolle connecties.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto grid justify-center gap-6 md:max-w-[64rem] md:grid-cols-2">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center space-x-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Waarom professionals kiezen voor Rolodink
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-2">
                <Target className="h-8 w-8 text-primary" />
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-muted-foreground">Focust op LinkedIn</div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div className="text-2xl font-bold">3x</div>
                <div className="text-sm text-muted-foreground">Betere follow-up</div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Zap className="h-8 w-8 text-primary" />
                <div className="text-2xl font-bold">30s</div>
                <div className="text-sm text-muted-foreground">Installatie tijd</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Klaar om te beginnen?
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Installeer Rolodink vandaag nog en transformeer je LinkedIn netwerk.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/download">
                  Download nu
                </Link>
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
