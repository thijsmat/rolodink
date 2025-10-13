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
              Rolodink: je notitielaag bovenop LinkedIn
            </h1>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Onthoud wie je sprak, waarover, en volg slimmer op. 
              Direct vanuit LinkedIn, zonder gedoe.
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
