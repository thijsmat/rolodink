import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageSection } from '@/components/layout/page-section'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { PageContent } from '@/components/layout/page-content'
import { CtaSection } from '@/components/layout/cta-section'
import { ProfessionGrid } from '@/components/layout/profession-grid'
import { CheckCircle, Users, MessageSquare, Calendar } from 'lucide-react'

const EXTENSION_URL = process.env.NEXT_PUBLIC_EXTENSION_URL || "https://chrome.google.com/webstore/detail/rolodink/..."

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section - Vintage Business Card Style */}
        <PageSection background="paper" className="min-h-screen flex items-center">
          <PageContainer className="max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Headline */}
              <div className="space-y-8">
                <PageHeader alignment="left">
                  <Badge className="bg-gold text-navy border-gold/20 px-4 py-2 text-sm font-medium">
                    🚀 Nu beschikbaar
                  </Badge>
                  <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl text-navy leading-tight">
                    Van de achterkant van een visitekaartje naar de toekomst van netwerken
                  </h1>
                  <PageContent maxWidth="lg">
                    <p className="font-inter text-lg text-charcoal leading-relaxed">
                      Vroeger schreef je op de achterkant van een visitekaartje waar je iemand ontmoette en waarover je sprak. 
                      Nu die tijd voorbij is, blijft je netwerk een raadsel. Rolodink brengt die persoonlijke touch terug naar je LinkedIn connecties.
                    </p>
                  </PageContent>
                </PageHeader>
                <CtaSection>
                  <Button asChild size="lg" className="vintage-button">
                    <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                      Add to Chrome - Gratis
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-navy text-navy hover:bg-navy hover:text-cream">
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
        <PageSection background="paper">
          <PageContainer className="max-w-6xl">
            <PageHeader>
              <h2 className="font-playfair text-4xl md:text-5xl text-navy">
                Waarom Rolodink?
              </h2>
              <PageContent maxWidth="xl">
                <p className="font-inter text-lg text-charcoal leading-relaxed">
                  Stop met vergeten wie je sprak. Organiseer je netwerk zoals het hoort.
                </p>
              </PageContent>
            </PageHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature Card 1 */}
                <div className="card-flip group cursor-pointer">
                  <div className="card-flip-inner">
                    <div className="card-flip-front">
                      <div className="business-card-elevated h-full">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-cream" />
                          </div>
                          <h3 className="font-playfair text-xl text-navy">Netwerk bijhouden</h3>
                          <p className="font-inter text-charcoal">Bewaar notities bij elke LinkedIn connectie</p>
                        </div>
                      </div>
                    </div>
                    <div className="card-flip-back">
                      <div className="business-card-elevated h-full bg-gold/5 border-gold/30">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-navy" />
                          </div>
                          <h3 className="font-playfair text-xl text-navy">Netwerk bijhouden</h3>
                          <ul className="font-inter text-sm text-charcoal space-y-2">
                            <li>• Automatische profielherkenning</li>
                            <li>• Persoonlijke notities per contact</li>
                            <li>• Zoeken in je netwerk</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Feature Card 2 */}
                <div className="card-flip group cursor-pointer">
                  <div className="card-flip-inner">
                    <div className="card-flip-front">
                      <div className="business-card-elevated h-full">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center">
                            <MessageSquare className="h-6 w-6 text-cream" />
                          </div>
                          <h3 className="font-playfair text-xl text-navy">Gesprekken onthouden</h3>
                          <p className="font-inter text-charcoal">Waar spraken jullie over? Waar ontmoetten jullie elkaar?</p>
                        </div>
                      </div>
                    </div>
                    <div className="card-flip-back">
                      <div className="business-card-elevated h-full bg-gold/5 border-gold/30">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                            <MessageSquare className="h-6 w-6 text-navy" />
                          </div>
                          <h3 className="font-playfair text-xl text-navy">Gesprekken onthouden</h3>
                          <ul className="font-inter text-sm text-charcoal space-y-2">
                            <li>• Contextuele notities</li>
                            <li>• Gespreksgeschiedenis</li>
                            <li>• Follow-up herinneringen</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Feature Card 3 */}
                <div className="card-flip group cursor-pointer">
                  <div className="card-flip-inner">
                    <div className="card-flip-front">
                      <div className="business-card-elevated h-full">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-cream" />
                          </div>
                          <h3 className="font-playfair text-xl text-navy">Slimmer opvolgen</h3>
                          <p className="font-inter text-charcoal">Geen vergeten afspraken of verloren contacten meer</p>
                        </div>
                      </div>
                    </div>
                    <div className="card-flip-back">
                      <div className="business-card-elevated h-full bg-gold/5 border-gold/30">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-navy" />
                          </div>
                          <h3 className="font-playfair text-xl text-navy">Slimmer opvolgen</h3>
                          <ul className="font-inter text-sm text-charcoal space-y-2">
                            <li>• Automatische herinneringen</li>
                            <li>• Follow-up templates</li>
                            <li>• Prioriteit instellen</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </PageContainer>
        </PageSection>

        {/* Social Proof */}
        <PageSection background="white">
          <PageContainer>
            <PageHeader>
              <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                Perfect voor professionals
              </h2>
            </PageHeader>
            <ProfessionGrid>
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
            </ProfessionGrid>
          </PageContainer>
        </PageSection>

        {/* FAQ - Vintage Accordion Cards */}
        <PageSection background="gray">
          <PageContainer>
            <PageHeader>
              <h2 className="font-playfair text-4xl md:text-5xl text-navy">FAQ</h2>
            </PageHeader>
            
            <div className="space-y-6">
              <div className="business-card-elevated border-gold/30">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-playfair text-xl text-navy font-semibold">
                      Waarom Rolodink? Er zijn toch genoeg CRM-systemen?
                    </h3>
                    <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center ml-4 flex-shrink-0">
                      <svg className="w-3 h-3 text-navy" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                  <div className="border-t border-navy/20 pt-4">
                    <PageContent>
                      <p className="font-inter text-charcoal leading-relaxed">
                        CRM-systemen zijn voor verkoop. Rolodink is voor menselijke connecties. Het is de digitale versie van wat je vroeger op de achterkant van een visitekaartje schreef — simpel, persoonlijk, en direct beschikbaar waar je het nodig hebt: in LinkedIn.
                      </p>
                    </PageContent>
                  </div>
                </div>
              </div>
            </div>
          </PageContainer>
        </PageSection>

        {/* CTA Section - Premium Business Card */}
        <PageSection background="paper">
          <PageContainer>
            <div className="business-card-elevated border-2 border-gold/50 bg-gradient-to-br from-cream to-warm-gray">
              <PageHeader>
                <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-navy" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h2 className="font-playfair text-4xl md:text-5xl text-navy">
                  Begin vandaag nog
                </h2>
                <PageContent maxWidth="xl">
                  <p className="font-inter text-lg text-charcoal leading-relaxed">
                    Installeer Rolodink en transformeer hoe je je LinkedIn netwerk beheert. 
                    Breng de persoonlijke touch van visitekaartjes terug naar je digitale netwerk.
                  </p>
                </PageContent>
              </PageHeader>
              
              <CtaSection className="mb-8">
                <Button asChild size="lg" className="vintage-button text-lg px-8 py-4">
                  <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                    Add to Chrome - Gratis
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-navy text-navy hover:bg-navy hover:text-cream text-lg px-8 py-4">
                  <Link href="/how-it-works">
                    Bekijk demo
                  </Link>
                </Button>
              </CtaSection>
              
              <div className="pt-8 border-t border-navy/20 text-center">
                <p className="font-inter text-sm text-charcoal/70">
                  Geen creditcard vereist • 30 seconden installatie • Werkt direct in LinkedIn
                </p>
              </div>
            </div>
          </PageContainer>
        </PageSection>
      </main>
      
      <SiteFooter />
    </div>
  )
}
