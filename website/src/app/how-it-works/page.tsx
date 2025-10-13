import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { 
  Download, 
  FileText, 
  Users,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import { pageSEO } from '@/lib/seo'

export const metadata = {
  title: pageSEO.howItWorks.title,
  description: pageSEO.howItWorks.description,
}

const steps = [
  {
    number: "01",
    icon: Download,
    title: "Installeer de extensie",
    description: "Voeg Rolodink toe aan je browser in 30 seconden. Werkt direct in LinkedIn zonder extra setup.",
    details: [
      "Klik op 'Add to Chrome'",
      "Bevestig de installatie",
      "Ga naar LinkedIn"
    ]
  },
  {
    number: "02", 
    icon: FileText,
    title: "Voeg notities toe",
    description: "Bezoek een LinkedIn profiel en klik op 'Voeg toe aan CRM' om notities te maken.",
    details: [
      "Ga naar een LinkedIn profiel",
      "Klik op de Rolodink knop",
      "Voeg notities en context toe"
    ]
  },
  {
    number: "03",
    icon: Users,
    title: "Organiseer je netwerk",
    description: "Bekijk al je notities in één overzicht. Zoek, filter en beheer je contacten met gemak.",
    details: [
      "Open het Rolodink popup",
      "Bekijk je netwerk overzicht",
      "Zoek en filter contacten"
    ]
  }
]

export default function HowItWorksPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Hoe werkt Rolodink?
            </h1>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              In 3 eenvoudige stappen transformeer je je LinkedIn netwerk in een 
              georganiseerde, krachtige database van waardevolle connecties.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto grid justify-center gap-8 md:max-w-[64rem]">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start space-x-4">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                          {step.number}
                        </div>
                        <div className="rounded-lg bg-primary/10 p-2">
                          <step.icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <CardTitle className="text-2xl">{step.title}</CardTitle>
                        <CardDescription className="text-base leading-relaxed">
                          {step.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-20">
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-4">
                    <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 md:rotate-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Waarom Rolodink werkt
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Geen complexe workflows, geen nieuwe gewoontes. Rolodink werkt met je bestaande LinkedIn routine.
            </p>
          </div>
          
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto rounded-lg bg-primary/10 p-3 w-fit">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Geen nieuwe apps</CardTitle>
                <CardDescription>
                  Werkt direct in LinkedIn. Geen extra software of complexe integraties.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto rounded-lg bg-primary/10 p-3 w-fit">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Eén klik</CardTitle>
                <CardDescription>
                  Voeg notities toe met één klik. Geen formulieren of ingewikkelde workflows.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto rounded-lg bg-primary/10 p-3 w-fit">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Direct resultaat</CardTitle>
                <CardDescription>
                  Zie meteen het verschil in hoe je je netwerk beheert en opvolgt.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Klaar om te beginnen?
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Installeer Rolodink nu en transformeer je LinkedIn netwerk in 3 minuten.
            </p>
            <Button asChild size="lg">
              <Link href="/download">
                Download Rolodink
              </Link>
            </Button>
          </div>
        </section>
      </main>
      
      <SiteFooter />
    </div>
  )
}
