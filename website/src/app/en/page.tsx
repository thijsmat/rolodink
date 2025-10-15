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
        {/* Hero Section - Vintage Business Card Style */}
        <section className="paper-texture min-h-screen flex items-center">
          <div className="container mx-auto px-6 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Headline */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <Badge className="bg-gold text-navy border-gold/20 px-4 py-2 text-sm font-medium">
                    🚀 Now available
                  </Badge>
                  <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl text-navy leading-tight">
                    From the back of a business card to the future of networking
                  </h1>
                  <p className="font-inter text-lg text-charcoal leading-relaxed max-w-lg">
                    You used to jot down where you met someone and what you talked about on the back of a business card. 
                    Now that cards are gone, your network feels fuzzy. Rolodink brings that personal touch back to your LinkedIn connections.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="vintage-button">
                    <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                      Add to Chrome - Free
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-navy text-navy hover:bg-navy hover:text-cream">
                    <Link href="/en/how-it-works">
                      How it works
                    </Link>
                  </Button>
                </div>
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
                          <p className="font-inter italic">"Met at Networking Event Amsterdam"</p>
                          <p className="font-inter italic">"Interested in AI for recruiting"</p>
                          <p className="font-inter italic">"Send article about ChatGPT"</p>
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
                              <strong>Rolodink Note:</strong> Met at Networking Event Amsterdam - interested in AI for recruiting - send article about ChatGPT
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
          </div>
        </section>

        {/* Why Rolodink? - Vintage Business Cards */}
        <section className="bg-warm-gray py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-playfair text-4xl md:text-5xl text-navy mb-6">Remember business cards?</h2>
                <p className="font-inter text-lg text-charcoal max-w-3xl mx-auto leading-relaxed">
                  You'd write on the back: 'Met at Networking Event Amsterdam — interested in AI for recruiting — send article about ChatGPT'. 
                  That tiny note made the difference between a forgotten name and a valuable connection.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Card 1 */}
                <div className="business-card-elevated transform rotate-1 hover:rotate-0 transition-transform duration-300">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-navy" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <h3 className="font-playfair text-xl text-navy">Keep crucial details</h3>
                    <p className="font-inter text-charcoal">Where did you meet? What did you discuss?</p>
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
                    <h3 className="font-playfair text-xl text-navy">Remember context</h3>
                    <p className="font-inter text-charcoal">Family, interests, ongoing projects</p>
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
                    <h3 className="font-playfair text-xl text-navy">Make follow‑ups personal</h3>
                    <p className="font-inter text-charcoal">'Hi Sarah, how did the interview at that AI startup go?'</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-12">
                <h3 className="font-playfair text-2xl text-navy">Modern networking, classic wisdom</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Features Preview - Vintage Business Cards */}
        <section className="paper-texture py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-playfair text-4xl md:text-5xl text-navy mb-6">
                  Why Rolodink?
                </h2>
                <p className="font-inter text-lg text-charcoal max-w-3xl mx-auto leading-relaxed">
                  Stop forgetting conversations. Organize your network the right way.
                </p>
              </div>
              
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
                          <h3 className="font-playfair text-xl text-navy">Keep track of your network</h3>
                          <p className="font-inter text-charcoal">Save notes on every LinkedIn connection</p>
                        </div>
                      </div>
                    </div>
                    <div className="card-flip-back">
                      <div className="business-card-elevated h-full bg-gold/5 border-gold/30">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-navy" />
                          </div>
                          <h3 className="font-playfair text-xl text-navy">Keep track of your network</h3>
                          <ul className="font-inter text-sm text-charcoal space-y-2">
                            <li>• Automatic profile detection</li>
                            <li>• Per‑contact notes</li>
                            <li>• Search your network</li>
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
                          <h3 className="font-playfair text-xl text-navy">Remember conversations</h3>
                          <p className="font-inter text-charcoal">What did you discuss? Where did you meet?</p>
                        </div>
                      </div>
                    </div>
                    <div className="card-flip-back">
                      <div className="business-card-elevated h-full bg-gold/5 border-gold/30">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                            <MessageSquare className="h-6 w-6 text-navy" />
                          </div>
                          <h3 className="font-playfair text-xl text-navy">Remember conversations</h3>
                          <ul className="font-inter text-sm text-charcoal space-y-2">
                            <li>• Contextual notes</li>
                            <li>• History</li>
                            <li>• Follow‑up reminders</li>
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
                          <h3 className="font-playfair text-xl text-navy">Smarter follow-ups</h3>
                          <p className="font-inter text-charcoal">No more missed commitments or lost contacts</p>
                        </div>
                      </div>
                    </div>
                    <div className="card-flip-back">
                      <div className="business-card-elevated h-full bg-gold/5 border-gold/30">
                        <div className="space-y-4">
                          <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-navy" />
                          </div>
                          <h3 className="font-playfair text-xl text-navy">Smarter follow-ups</h3>
                          <ul className="font-inter text-sm text-charcoal space-y-2">
                            <li>• Smart reminders</li>
                            <li>• Templates</li>
                            <li>• Priorities</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Perfect for professionals
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {['Recruiters','Sales professionals','Networkers','Freelancers','Consultants','Entrepreneurs'].map((t)=> (
                <div key={t} className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ - Vintage Accordion Cards */}
        <section className="bg-warm-gray py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-playfair text-4xl md:text-5xl text-navy text-center mb-16">FAQ</h2>
              
              <div className="space-y-6">
                <div className="business-card-elevated border-gold/30">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-playfair text-xl text-navy font-semibold">
                        Why Rolodink? Aren't there enough CRMs?
                      </h3>
                      <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center ml-4 flex-shrink-0">
                        <svg className="w-3 h-3 text-navy" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    </div>
                    <div className="border-t border-navy/20 pt-4">
                      <p className="font-inter text-charcoal leading-relaxed">
                        CRMs are for sales. Rolodink is for human connections. It's the digital version of what you used to write on the back of a business card — simple, personal, and right where you need it: inside LinkedIn.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Premium Business Card */}
        <section className="paper-texture py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="business-card-elevated border-2 border-gold/50 bg-gradient-to-br from-cream to-warm-gray">
                <div className="text-center space-y-8">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-navy" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <h2 className="font-playfair text-4xl md:text-5xl text-navy">
                      Get started today
                    </h2>
                    <p className="font-inter text-lg text-charcoal max-w-2xl mx-auto leading-relaxed">
                      Install Rolodink and transform how you manage your LinkedIn network. 
                      Bring the personal touch of business cards back to your digital network.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="vintage-button text-lg px-8 py-4">
                      <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                        Add to Chrome - Free
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-navy text-navy hover:bg-navy hover:text-cream text-lg px-8 py-4">
                      <Link href="/en/how-it-works">
                        View demo
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="pt-8 border-t border-navy/20">
                    <p className="font-inter text-sm text-charcoal/70">
                      No credit card required • 30‑second install • Works directly in LinkedIn
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}


