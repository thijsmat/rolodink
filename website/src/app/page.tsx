import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-enhanced'
import { Badge } from '@/components/ui/badge'
import { Text } from '@/components/ui/text'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageSection } from '@/components/layout/page-section'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { PageContent } from '@/components/layout/page-content'
import { CtaSection } from '@/components/layout/cta-section'
import { Grid } from '@/components/layout/grid'
import { CheckCircle, Users, MessageSquare, Calendar } from 'lucide-react'

const EXTENSION_URL = process.env.NEXT_PUBLIC_EXTENSION_URL || "https://chrome.google.com/webstore/detail/rolodink/..."

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section - Vintage Business Card Style */}
        <PageSection background="paper" fullHeight>
          <PageContainer size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left Side - Headline */}
              <div className="space-y-8 animate-fade-in">
                <PageHeader alignment="left" spacing="lg">
                  <Badge className="bg-gold text-navy border-gold/20 px-4 py-2 text-sm font-medium shadow-sm">
                    🚀 Nu beschikbaar
                  </Badge>
                  <Text 
                    variant="heading" 
                    size="6xl" 
                    weight="bold"
                    className="text-navy leading-tight tracking-tight"
                  >
                    Van de achterkant van een visitekaartje naar de toekomst van netwerken
                  </Text>
                  <PageContent maxWidth="xl" alignment="left">
                    <Text variant="lead" className="text-charcoal leading-relaxed">
                      Vroeger schreef je op de achterkant van een visitekaartje waar je iemand ontmoette en waarover je sprak. 
                      Nu die tijd voorbij is, blijft je netwerk een raadsel. Rolodink brengt die persoonlijke touch terug naar je LinkedIn connecties.
                    </Text>
                  </PageContent>
                </PageHeader>
                <CtaSection spacing="lg">
                  <Button asChild size="xl" variant="vintage">
                    <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                      Add to Chrome - Gratis
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="xl" className="border-navy text-navy hover:bg-navy hover:text-cream">
                    <Link href="/how-it-works">
                      Hoe werkt het?
                    </Link>
                  </Button>
                </CtaSection>
              </div>
              
              {/* Right Side - Business Card Visual Metaphor */}
              <div className="relative">
                <div className="business-card-elevated max-w-md mx-auto">
                  <div className="space-y-6">
                    {/* Vintage Business Card */}
                    <div className="business-card border-2 border-gold/30 relative">
                      <div className="space-y-4">
                        <div className="border-b border-navy/20 pb-2">
                          <h3 className="font-playfair text-xl text-navy">Sarah Johnson</h3>
                          <p className="font-inter text-sm text-charcoal">HR Director, TechCorp</p>
                        </div>
                        <div className="space-y-2 text-sm text-charcoal">
                          <p className="font-inter italic">"Ontmoet op Networking Event Amsterdam"</p>
                          <p className="font-inter italic">"Geïnteresseerd in AI voor recruitment"</p>
                          <p className="font-inter italic">"Stuur artikel over ChatGPT"</p>
                        </div>
                        <div className="absolute top-2 right-2 w-3 h-3 bg-gold rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Transition Arrow */}
                    <div className="flex justify-center">
                      <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-navy" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Modern LinkedIn Profile */}
                    <div className="business-card border-2 border-linkedin/30 relative">
                      <div className="space-y-4">
                        <div className="border-b border-linkedin/20 pb-2">
                          <h3 className="font-playfair text-xl text-navy">Sarah Johnson</h3>
                          <p className="font-inter text-sm text-charcoal">HR Director, TechCorp</p>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-linkedin/10 p-3 rounded border-l-4 border-linkedin">
                            <p className="font-inter text-sm text-charcoal">
                              <strong>Rolodink Note:</strong> Met op Networking Event Amsterdam - geïnteresseerd in AI voor recruitment - stuur artikel over ChatGPT
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 w-3 h-3 bg-linkedin rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PageContainer>
        </PageSection>

        {/* Waarom Rolodink? - Vintage Business Cards */}
        <PageSection background="gray">
          <PageContainer className="max-w-6xl">
            <PageHeader>
              <h2 className="font-playfair text-4xl md:text-5xl text-navy">Herinner je je nog visitekaartjes?</h2>
              <PageContent maxWidth="xl">
                <p className="font-inter text-lg text-charcoal leading-relaxed">
                  Voorheen schreef je op de achterkant: 'Ontmoet op Networking Event Amsterdam - geïnteresseerd in AI voor recruitment - stuur artikel over ChatGPT'. 
                  Dat kleine notitie maakte het verschil tussen een vergeten contact en een waardevolle verbinding.
                </p>
              </PageContent>
            </PageHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Card 1 */}
                <div className="business-card-elevated transform rotate-1 hover:rotate-0 transition-transform duration-300">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-navy" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <h3 className="font-playfair text-xl text-navy">Bewaar die cruciale details</h3>
                    <p className="font-inter text-charcoal">Waar ontmoette je elkaar? Waarover spraken jullie?</p>
                  </div>
                </div>
                
                {/* Card 2 */}
                <div className="business-card-elevated transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-navy" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="font-playfair text-xl text-navy">Onthoud de context</h3>
                    <p className="font-inter text-charcoal">Familiesituatie, interesses, lopende projecten</p>
                  </div>
                </div>
                
                {/* Card 3 */}
                <div className="business-card-elevated transform rotate-1 hover:rotate-0 transition-transform duration-300">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-navy" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                    </div>
                    <h3 className="font-playfair text-xl text-navy">Maak opvolging persoonlijk</h3>
                    <p className="font-inter text-charcoal">'Hoi Sarah, hoe ging dat sollicitatiegesprek bij die AI startup?'</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-12">
                <h3 className="font-playfair text-2xl text-navy">Moderne netwerken, klassieke wijsheid</h3>
              </div>
          </PageContainer>
        </PageSection>

        {/* Features Preview - Vintage Business Cards */}
        <PageSection background="gradient" padding="lg">
          <PageContainer size="lg">
            <PageHeader spacing="lg">
              <Text variant="heading" size="5xl" weight="bold" className="text-navy">
                Waarom Rolodink?
              </Text>
              <PageContent maxWidth="2xl">
                <Text variant="lead" className="text-charcoal leading-relaxed">
                  Stop met vergeten wie je sprak. Organiseer je netwerk zoals het hoort.
                </Text>
              </PageContent>
            </PageHeader>
              
            <Grid cols={3} gap="lg">
              {/* Feature Card 1 */}
              <Card variant="elevated" hover className="group cursor-pointer transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-cream" />
                  </div>
                  <CardTitle>Netwerk bijhouden</CardTitle>
                  <CardDescription>
                    Bewaar notities bij elke LinkedIn connectie
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="font-inter text-sm text-charcoal space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                      Automatische profielherkenning
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                      Persoonlijke notities per contact
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                      Zoeken in je netwerk
                    </li>
                  </ul>
                </CardContent>
              </Card>
                
              {/* Feature Card 2 */}
              <Card variant="elevated" hover className="group cursor-pointer transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-cream" />
                  </div>
                  <CardTitle>Gesprekken onthouden</CardTitle>
                  <CardDescription>
                    Waar spraken jullie over? Waar ontmoetten jullie elkaar?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="font-inter text-sm text-charcoal space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                      Contextuele notities
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                      Gespreksgeschiedenis
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                      Follow-up herinneringen
                    </li>
                  </ul>
                </CardContent>
              </Card>
                
              {/* Feature Card 3 */}
              <Card variant="elevated" hover className="group cursor-pointer transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-cream" />
                  </div>
                  <CardTitle>Slimmer opvolgen</CardTitle>
                  <CardDescription>
                    Geen vergeten afspraken of verloren contacten meer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="font-inter text-sm text-charcoal space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                      Automatische herinneringen
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                      Follow-up templates
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                      Prioriteit instellen
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Grid>
          </PageContainer>
        </PageSection>

        {/* Social Proof */}
        <PageSection background="white" padding="lg">
          <PageContainer>
            <PageHeader spacing="lg">
              <Text variant="heading" size="5xl" weight="bold" className="text-navy">
                Perfect voor professionals
              </Text>
            </PageHeader>
            <Grid cols={3} gap="md">
              <div className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="font-inter text-sm font-medium text-charcoal">Recruiters</span>
              </div>
              <div className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="font-inter text-sm font-medium text-charcoal">Sales professionals</span>
              </div>
              <div className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="font-inter text-sm font-medium text-charcoal">Netwerkers</span>
              </div>
              <div className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="font-inter text-sm font-medium text-charcoal">Freelancers</span>
              </div>
              <div className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="font-inter text-sm font-medium text-charcoal">Consultants</span>
              </div>
              <div className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="font-inter text-sm font-medium text-charcoal">Entrepreneurs</span>
              </div>
            </Grid>
          </PageContainer>
        </PageSection>

        {/* FAQ - Vintage Accordion Cards */}
        <PageSection background="gray" padding="lg">
          <PageContainer>
            <PageHeader spacing="lg">
              <Text variant="heading" size="5xl" weight="bold" className="text-navy">
                FAQ
              </Text>
            </PageHeader>
            
            <div className="space-y-6">
              <Card variant="vintage" className="transition-all duration-200 hover:shadow-xl">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-left">
                      Waarom Rolodink? Er zijn toch genoeg CRM-systemen?
                    </CardTitle>
                    <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center ml-4 flex-shrink-0">
                      <svg className="w-3 h-3 text-navy" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <PageContent>
                    <Text variant="body" className="text-charcoal leading-relaxed">
                      CRM-systemen zijn voor verkoop. Rolodink is voor menselijke connecties. Het is de digitale versie van wat je vroeger op de achterkant van een visitekaartje schreef — simpel, persoonlijk, en direct beschikbaar waar je het nodig hebt: in LinkedIn.
                    </Text>
                  </PageContent>
                </CardContent>
              </Card>
            </div>
          </PageContainer>
        </PageSection>

        {/* CTA Section - Premium Business Card */}
        <PageSection background="paper" padding="xl">
          <PageContainer>
            <Card variant="vintage" className="text-center">
              <CardHeader className="pb-8">
                <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-navy" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <Text variant="heading" size="5xl" weight="bold" className="text-navy mb-6">
                  Begin vandaag nog
                </Text>
                <PageContent maxWidth="xl">
                  <Text variant="lead" className="text-charcoal leading-relaxed">
                    Installeer Rolodink en transformeer hoe je je LinkedIn netwerk beheert. 
                    Breng de persoonlijke touch van visitekaartjes terug naar je digitale netwerk.
                  </Text>
                </PageContent>
              </CardHeader>
              
              <CtaSection spacing="lg" className="mb-8">
                <Button asChild size="xl" variant="vintage">
                  <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                    Add to Chrome - Gratis
                  </a>
                </Button>
                <Button asChild variant="outline" size="xl" className="border-navy text-navy hover:bg-navy hover:text-cream">
                  <Link href="/how-it-works">
                    Bekijk demo
                  </Link>
                </Button>
              </CtaSection>
              
              <div className="pt-8 border-t border-navy/20">
                <Text variant="caption" className="text-charcoal/70">
                  Geen creditcard vereist • 30 seconden installatie • Werkt direct in LinkedIn
                </Text>
              </div>
            </Card>
          </PageContainer>
        </PageSection>
      </main>
      
      <SiteFooter />
    </div>
  )
}
