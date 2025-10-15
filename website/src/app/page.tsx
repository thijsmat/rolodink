import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CheckCircle, Users, MessageSquare, Calendar } from 'lucide-react'

const EXTENSION_URL = process.env.NEXT_PUBLIC_EXTENSION_URL || "https://chrome.google.com/webstore/detail/rolodink/..."

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-32">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              🚀 Nu beschikbaar
            </Badge>
            <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Van de achterkant van een visitekaartje naar de toekomst van netwerken
            </h1>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Vroeger schreef je op de achterkant van een visitekaartje waar je iemand ontmoette en waarover je sprak. 
              Nu die tijd voorbij is, blijft je netwerk een raadsel. Rolodink brengt die persoonlijke touch terug naar je LinkedIn connecties.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                  Add to Chrome - Gratis
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/how-it-works">
                  Hoe werkt het?
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Waarom Rolodink? (Nostalgic Section) */}
        <section className="container py-8 md:py-12 lg:py-24">
          <div className="mx-auto max-w-3xl space-y-4">
            <h2 className="text-2xl md:text-4xl font-semibold">Herinner je je nog visitekaartjes?</h2>
            <p className="text-muted-foreground">
              Voorheen schreef je op de achterkant: 'Ontmoet op Networking Event Amsterdam - geïnteresseerd in AI voor recruitment - stuur artikel over ChatGPT'. 
              Dat kleine notitie maakte het verschil tussen een vergeten contact en een waardevolle verbinding.
            </p>
            <h3 className="text-xl font-semibold">Moderne netwerken, klassieke wijsheid</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Bewaar die cruciale details: Waar ontmoette je elkaar? Waarover spraken jullie?</li>
              <li>Onthoud de context: Familiesituatie, interesses, lopende projecten</li>
              <li>Maak opvolging persoonlijk: 'Hoi Sarah, hoe ging dat sollicitatiegesprek bij die AI startup?'</li>
            </ul>
          </div>
        </section>

        {/* Features Preview */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Waarom Rolodink?
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Stop met vergeten wie je sprak. Organiseer je netwerk zoals het hoort.
            </p>
          </div>
          
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary" />
                <CardTitle>Netwerk bijhouden</CardTitle>
                <CardDescription>
                  Bewaar notities bij elke LinkedIn connectie
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-primary" />
                <CardTitle>Gesprekken onthouden</CardTitle>
                <CardDescription>
                  Waar spraken jullie over? Waar ontmoetten jullie elkaar?
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-primary" />
                <CardTitle>Slimmer opvolgen</CardTitle>
                <CardDescription>
                  Geen vergeten afspraken of verloren contacten meer
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Social Proof */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Perfect voor professionals
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Recruiters</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Sales professionals</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Netwerkers</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Freelancers</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Consultants</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Entrepreneurs</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col space-y-4">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-5xl text-center">FAQ</h2>
            <div className="rounded-lg border p-6 bg-background">
              <p className="font-semibold">Waarom Rolodink? Er zijn toch genoeg CRM-systemen?</p>
              <p className="mt-2 text-muted-foreground">
                CRM-systemen zijn voor verkoop. Rolodink is voor menselijke connecties. Het is de digitale versie van wat je vroeger op de achterkant van een visitekaartje schreef — simpel, persoonlijk, en direct beschikbaar waar je het nodig hebt: in LinkedIn.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Begin vandaag nog
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Installeer Rolodink en transformeer hoe je je LinkedIn netwerk beheert.
            </p>
            <Button asChild size="lg" className="mt-4">
              <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                Add to Chrome - Gratis
              </a>
            </Button>
          </div>
        </section>
      </main>
      
      <SiteFooter />
    </div>
  )
}
