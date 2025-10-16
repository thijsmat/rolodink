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
import { TestimonialCard } from '@/components/ui/testimonial-card'
import { Accordion, AccordionItem } from '@/components/ui/accordion'
import { CheckCircle, Users, MessageSquare, Calendar } from 'lucide-react'

const EXTENSION_URL = process.env.NEXT_PUBLIC_EXTENSION_URL || "https://chrome.google.com/webstore/detail/rolodink/..."

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section - Professional Split Layout */}
        <PageSection background="paper" fullHeight>
          <PageContainer size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left Side - Headline & Content */}
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-6">
                  <Badge className="bg-gold text-navy border-gold/20 px-4 py-2 text-sm font-medium shadow-sm w-fit">
                    🚀 Nu beschikbaar
                  </Badge>
                  
                  <div className="space-y-6">
                    <Text 
                      variant="heading" 
                      size="6xl" 
                      weight="bold"
                      className="text-navy leading-tight tracking-tight"
                    >
                      Van visitekaartjes naar slim netwerken
                    </Text>
                    
                    <Text variant="lead" className="text-charcoal leading-relaxed max-w-prose">
                      Vroeger schreef je op de achterkant van een visitekaartje waar je iemand ontmoette en waarover je sprak. 
                      Nu die tijd voorbij is, blijft je netwerk een raadsel. Rolodink brengt die persoonlijke touch terug naar je LinkedIn connecties.
                    </Text>
                  </div>
                </div>
                
                <CtaSection spacing="lg" className="pt-4">
                  <Button asChild size="xl" variant="vintage" className="shadow-lg hover:shadow-xl transition-shadow">
                    <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                      Add to Chrome - Gratis
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="xl" className="border-navy text-navy hover:bg-navy hover:text-cream shadow-sm">
                    <Link href="/how-it-works">
                      Hoe werkt het?
                    </Link>
                  </Button>
                </CtaSection>
              </div>
              
              {/* Right Side - Professional Illustration */}
              <div className="relative">
                <div className="relative max-w-lg mx-auto">
                  {/* Main illustration container */}
                  <div className="relative bg-gradient-to-br from-cream to-warm-gray rounded-2xl p-8 shadow-2xl border border-gold/20">
                    {/* Paper texture overlay */}
                    <div className="absolute inset-0 rounded-2xl opacity-5 pointer-events-none" 
                         style={{
                           backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`
                         }} />
                    
                    {/* Business card transformation visual */}
                    <div className="relative space-y-6">
                      {/* Before: Traditional business card */}
                      <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-gold/30 relative transform rotate-2">
                        <div className="space-y-3">
                          <div className="border-b border-navy/20 pb-3">
                            <h3 className="font-playfair text-lg text-navy font-semibold">Sarah Johnson</h3>
                            <p className="font-inter text-sm text-charcoal">HR Director, TechCorp</p>
                          </div>
                          <div className="space-y-2 text-xs text-charcoal/80">
                            <p className="font-inter italic">"Ontmoet op Networking Event"</p>
                            <p className="font-inter italic">"Geïnteresseerd in AI recruitment"</p>
                          </div>
                          <div className="absolute top-2 right-2 w-2 h-2 bg-gold rounded-full"></div>
                        </div>
                      </div>
                      
                      {/* Transformation arrow */}
                      <div className="flex justify-center">
                        <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-navy" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* After: LinkedIn with Rolodink notes */}
                      <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-linkedin/30 relative transform -rotate-1">
                        <div className="space-y-3">
                          <div className="border-b border-linkedin/20 pb-3">
                            <h3 className="font-playfair text-lg text-navy font-semibold">Sarah Johnson</h3>
                            <p className="font-inter text-sm text-charcoal">HR Director, TechCorp</p>
                          </div>
                          <div className="bg-linkedin/10 p-3 rounded-lg border-l-4 border-linkedin">
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-linkedin rounded-full mt-1.5 flex-shrink-0"></div>
                              <p className="font-inter text-xs text-charcoal">
                                <strong>Rolodink:</strong> Networking Event Amsterdam - AI recruitment - stuur ChatGPT artikel
                              </p>
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 w-2 h-2 bg-linkedin rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating elements for visual interest */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-gold/20 rounded-full"></div>
                  <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-navy/10 rounded-full"></div>
                </div>
              </div>
            </div>
          </PageContainer>
        </PageSection>


        {/* Features Section - Professional Cards */}
        <PageSection background="white" padding="lg">
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
              <Card variant="elevated" hover className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-navy to-navy/80 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                    <Users className="h-8 w-8 text-cream" />
                  </div>
                  <CardTitle className="text-center">Netwerk bijhouden</CardTitle>
                  <CardDescription className="text-center">
                    Bewaar notities bij elke LinkedIn connectie
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="font-inter text-sm text-charcoal space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Automatische profielherkenning</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Persoonlijke notities per contact</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Zoeken in je netwerk</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
                
              {/* Feature Card 2 */}
              <Card variant="elevated" hover className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-navy to-navy/80 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                    <MessageSquare className="h-8 w-8 text-cream" />
                  </div>
                  <CardTitle className="text-center">Gesprekken onthouden</CardTitle>
                  <CardDescription className="text-center">
                    Waar spraken jullie over? Waar ontmoetten jullie elkaar?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="font-inter text-sm text-charcoal space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Contextuele notities</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Gespreksgeschiedenis</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Follow-up herinneringen</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
                
              {/* Feature Card 3 */}
              <Card variant="elevated" hover className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-navy to-navy/80 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                    <Calendar className="h-8 w-8 text-cream" />
                  </div>
                  <CardTitle className="text-center">Slimmer opvolgen</CardTitle>
                  <CardDescription className="text-center">
                    Geen vergeten afspraken of verloren contacten meer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="font-inter text-sm text-charcoal space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Automatische herinneringen</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Follow-up templates</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Prioriteit instellen</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Grid>
          </PageContainer>
        </PageSection>

        {/* Testimonials Section */}
        <PageSection background="gray" padding="lg">
          <PageContainer size="lg">
            <PageHeader spacing="lg">
              <Text variant="heading" size="5xl" weight="bold" className="text-navy">
                Wat zeggen onze gebruikers?
              </Text>
              <PageContent maxWidth="2xl">
                <Text variant="lead" className="text-charcoal leading-relaxed">
                  Ontdek hoe professionals hun netwerk transformeren met Rolodink.
                </Text>
              </PageContent>
            </PageHeader>
            
            <Grid cols={2} gap="lg">
              <TestimonialCard
                quote="Rolodink heeft mijn netwerk compleet veranderd. Ik vergeet nooit meer waar ik iemand heb ontmoet of waar we over spraken. Het is alsof ik een persoonlijke assistent heb voor mijn LinkedIn connecties."
                author={{
                  name: "Sarah van der Berg",
                  role: "Sales Director",
                  company: "TechFlow"
                }}
              />
              
              <TestimonialCard
                quote="Als recruiter is het cruciaal om details bij te houden van elke kandidaat. Rolodink maakt het zo makkelijk om notities toe te voegen en terug te vinden. Het bespaart me uren per week."
                author={{
                  name: "Mark Janssen",
                  role: "Senior Recruiter",
                  company: "TalentFirst"
                }}
              />
              
              <TestimonialCard
                quote="De vintage stijl van Rolodink past perfect bij mijn professionele uitstraling. Het voelt alsof ik een moderne versie van mijn visitekaartjes beheer."
                author={{
                  name: "Lisa Chen",
                  role: "Marketing Consultant",
                  company: "BrandWise"
                }}
              />
              
              <TestimonialCard
                quote="Ik was sceptisch over nog een tool, maar Rolodink integreert zo naadloos in LinkedIn dat ik het niet meer kan missen. Het is echt een game-changer voor netwerken."
                author={{
                  name: "Tom Bakker",
                  role: "Business Development",
                  company: "GrowthCo"
                }}
              />
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

        {/* FAQ Section - Professional Accordion */}
        <PageSection background="gray" padding="lg">
          <PageContainer>
            <PageHeader spacing="lg">
              <Text variant="heading" size="5xl" weight="bold" className="text-navy">
                Veelgestelde vragen
              </Text>
              <PageContent maxWidth="2xl">
                <Text variant="lead" className="text-charcoal leading-relaxed">
                  Alles wat je moet weten over Rolodink.
                </Text>
              </PageContent>
            </PageHeader>
            
            <Accordion className="max-w-4xl mx-auto">
              <AccordionItem title="Waarom Rolodink? Er zijn toch genoeg CRM-systemen?">
                <Text variant="body" className="text-charcoal leading-relaxed">
                  CRM-systemen zijn voor verkoop. Rolodink is voor menselijke connecties. Het is de digitale versie van wat je vroeger op de achterkant van een visitekaartje schreef — simpel, persoonlijk, en direct beschikbaar waar je het nodig hebt: in LinkedIn.
                </Text>
              </AccordionItem>
              
              <AccordionItem title="Hoe werkt Rolodink precies?">
                <div className="space-y-4">
                  <Text variant="body" className="text-charcoal leading-relaxed">
                    Rolodink is een Chrome extensie die naadloos integreert met LinkedIn. Wanneer je iemand toevoegt aan je netwerk, kun je direct notities toevoegen over waar je elkaar ontmoette en waarover je sprak.
                  </Text>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-charcoal">Installeer de Chrome extensie</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-charcoal">Voeg notities toe bij LinkedIn connecties</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-charcoal">Zoek en filter je netwerk</span>
                    </li>
                  </ul>
                </div>
              </AccordionItem>
              
              <AccordionItem title="Is Rolodink gratis te gebruiken?">
                <Text variant="body" className="text-charcoal leading-relaxed">
                  Ja! Rolodink is volledig gratis te gebruiken. We geloven dat netwerken voor iedereen toegankelijk moet zijn. Er zijn geen verborgen kosten, abonnementen of beperkingen.
                </Text>
              </AccordionItem>
              
              <AccordionItem title="Wat gebeurt er met mijn data?">
                <div className="space-y-4">
                  <Text variant="body" className="text-charcoal leading-relaxed">
                    Privacy is voor ons cruciaal. Je data wordt veilig opgeslagen en is alleen toegankelijk voor jou. We verkopen geen data aan derden en je kunt altijd je account verwijderen.
                  </Text>
                  <Text variant="body" className="text-charcoal leading-relaxed">
                    Lees onze volledige privacy policy voor meer details over hoe we je data beschermen.
                  </Text>
                </div>
              </AccordionItem>
              
              <AccordionItem title="Werkt Rolodink op alle apparaten?">
                <Text variant="body" className="text-charcoal leading-relaxed">
                  Rolodink is momenteel beschikbaar als Chrome extensie voor desktop en laptop computers. We werken aan uitbreidingen voor andere browsers en mobiele apparaten.
                </Text>
              </AccordionItem>
            </Accordion>
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
