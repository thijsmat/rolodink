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
        <section className="py-24 px-8 bg-background">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-16">
              <h1 className="font-playfair font-semibold text-5xl text-azure mb-4">
                Hoe werkt Rolodink?
              </h1>
              <p className="text-xl text-grey max-w-[672px] mx-auto">
                In 3 eenvoudige stappen transformeer je je LinkedIn netwerk in een 
                georganiseerde, krachtige database van waardevolle connecties.
              </p>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-24 px-8 bg-white">
          <div className="max-w-[1136px] mx-auto">
            <div className="grid justify-center gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <Card className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start space-x-4">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-azure text-white font-bold text-lg">
                            {step.number}
                          </div>
                          <div className="rounded-lg bg-azure/10 p-2">
                            <step.icon className="h-6 w-6 text-azure" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <CardTitle className="text-2xl text-azure">{step.title}</CardTitle>
                          <CardDescription className="text-base leading-relaxed text-grey">
                            {step.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pl-20">
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-gold flex-shrink-0" />
                            <span className="text-grey">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  {/* Arrow between steps */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-4">
                      <ArrowRight className="h-6 w-6 text-grey rotate-90 md:rotate-0" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-24 px-8 bg-background">
          <div className="max-w-[1136px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-playfair font-semibold text-5xl text-azure mb-4">
                Waarom Rolodink werkt
              </h2>
              <p className="text-xl text-grey max-w-[672px] mx-auto">
                Geen complexe workflows, geen nieuwe gewoontes. Rolodink werkt met je bestaande LinkedIn routine.
              </p>
            </div>
            
            <div className="grid justify-center gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto rounded-lg bg-azure/10 p-3 w-fit">
                    <Users className="h-8 w-8 text-azure" />
                  </div>
                  <CardTitle className="text-azure">Geen nieuwe apps</CardTitle>
                  <CardDescription className="text-grey">
                    Werkt direct in LinkedIn. Geen extra software of complexe integraties.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto rounded-lg bg-azure/10 p-3 w-fit">
                    <FileText className="h-8 w-8 text-azure" />
                  </div>
                  <CardTitle className="text-azure">Eén klik</CardTitle>
                  <CardDescription className="text-grey">
                    Voeg notities toe met één klik. Geen formulieren of ingewikkelde workflows.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto rounded-lg bg-azure/10 p-3 w-fit">
                    <CheckCircle className="h-8 w-8 text-azure" />
                  </div>
                  <CardTitle className="text-azure">Direct resultaat</CardTitle>
                  <CardDescription className="text-grey">
                    Zie meteen het verschil in hoe je je netwerk beheert en opvolgt.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-8 bg-white">
          <div className="max-w-[1136px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-playfair font-semibold text-5xl text-azure mb-4">
                Klaar om te beginnen?
              </h2>
              <p className="text-xl text-grey max-w-[672px] mx-auto">
                Installeer Rolodink nu en transformeer je LinkedIn netwerk in 3 minuten.
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/download">
                  Download Rolodink
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
