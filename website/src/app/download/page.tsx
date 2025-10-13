import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { 
  Download, 
  Chrome, 
  Shield, 
  Clock,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import { pageSEO } from '@/lib/seo'

export const metadata = {
  title: pageSEO.download.title,
  description: pageSEO.download.description,
}

const EXTENSION_URL = process.env.NEXT_PUBLIC_EXTENSION_URL || "https://chrome.google.com/webstore/detail/rolodink/..."

const features = [
  "Werkt direct in LinkedIn",
  "Geen account nodig",
  "Lokaal opgeslagen data",
  "Privacy-first design",
  "Gratis voor altijd"
]

const steps = [
  {
    step: "1",
    title: "Klik op 'Add to Chrome'",
    description: "Je wordt doorgestuurd naar de Chrome Web Store"
  },
  {
    step: "2", 
    title: "Bevestig installatie",
    description: "Klik op 'Add extension' in de Chrome Web Store"
  },
  {
    step: "3",
    title: "Ga naar LinkedIn",
    description: "Bezoek een LinkedIn profiel en zie de Rolodink knop"
  }
]

export default function DownloadPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              🚀 Gratis download
            </Badge>
            <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Download Rolodink
            </h1>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Installeer Rolodink in je browser en begin vandaag nog met het organiseren van je LinkedIn netwerk.
            </p>
          </div>
        </section>

        {/* Download Section */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-8">
            {/* Main Download Card */}
            <Card className="w-full max-w-lg">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto rounded-lg bg-primary/10 p-4 w-fit">
                  <Chrome className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Rolodink voor Chrome</CardTitle>
                  <CardDescription className="text-base">
                    Werkt met alle Chromium browsers (Chrome, Edge, Brave)
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button asChild size="lg" className="w-full">
                  <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Add to Chrome - Gratis
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Waarom Chrome?</p>
                  <p className="text-sm text-muted-foreground">
                    De meeste professionals gebruiken Chrome of een Chromium browser. 
                    Rolodink werkt optimaal in deze omgeving.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 w-full max-w-2xl">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Installation Steps */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Installatie in 3 stappen
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Rolodink installeert in minder dan een minuut. Geen complexe setup, geen accounts nodig.
            </p>
          </div>
          
          <div className="mx-auto grid justify-center gap-6 md:max-w-[64rem] md:grid-cols-3">
            {steps.map((step, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                    {step.step}
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                  <CardDescription className="text-base">
                    {step.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Security & Privacy */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Veilig en privacy-vriendelijk
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Je data blijft van jou. Rolodink respecteert je privacy en beveiligt je informatie.
            </p>
          </div>
          
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto rounded-lg bg-primary/10 p-3 w-fit mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Lokale opslag</CardTitle>
                <CardDescription>
                  Alle data wordt lokaal opgeslagen in je browser. Geen externe servers.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto rounded-lg bg-primary/10 p-3 w-fit mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Geen tracking</CardTitle>
                <CardDescription>
                  We volgen je niet. Geen analytics, geen dataverzameling, geen advertenties.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto rounded-lg bg-primary/10 p-3 w-fit mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Open source</CardTitle>
                <CardDescription>
                  Code is open source. Je kunt altijd zien wat Rolodink doet met je data.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Alternative Installation */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Problemen met installatie?
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Geen Chrome Web Store beschikbaar? Geen probleem, we hebben alternatieven.
            </p>
          </div>
          
          <Card className="mx-auto max-w-lg">
            <CardHeader className="text-center">
              <CardTitle>Handmatige installatie</CardTitle>
              <CardDescription>
                Voor ontwikkelaars of als de Chrome Web Store niet beschikbaar is
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">1. Download de broncode</p>
                <p className="text-xs text-muted-foreground">
                  Download Rolodink van GitHub
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">2. Open Chrome Extensions</p>
                <p className="text-xs text-muted-foreground">
                  Ga naar chrome://extensions/ en schakel "Developer mode" in
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">3. Laad onverpakt</p>
                <p className="text-xs text-muted-foreground">
                  Klik "Laad onverpakt" en selecteer de map met de extensie
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a href="https://github.com/matthijsgoes/rolodink" target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Download van GitHub
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
      
      <SiteFooter />
    </div>
  )
}
