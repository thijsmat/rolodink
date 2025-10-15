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
              🚀 Now available
            </Badge>
            <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              From the back of a business card to the future of networking
            </h1>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              You used to jot down where you met someone and what you talked about on the back of a business card. 
              Now that cards are gone, your network feels fuzzy. Rolodink brings that personal touch back to your LinkedIn connections.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                  Add to Chrome - Free
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/en/how-it-works">
                  How it works
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Why Rolodink? (Nostalgic Section) */}
        <section className="container py-8 md:py-12 lg:py-24">
          <div className="mx-auto max-w-3xl space-y-4">
            <h2 className="text-2xl md:text-4xl font-semibold">Remember business cards?</h2>
            <p className="text-muted-foreground">
              You’d write on the back: ‘Met at Networking Event Amsterdam — interested in AI for recruiting — send article about ChatGPT’. 
              That tiny note made the difference between a forgotten name and a valuable connection.
            </p>
            <h3 className="text-xl font-semibold">Modern networking, classic wisdom</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Keep crucial details: Where did you meet? What did you discuss?</li>
              <li>Remember context: Family, interests, ongoing projects</li>
              <li>Make follow‑ups personal: ‘Hi Sarah, how did the interview at that AI startup go?’</li>
            </ul>
          </div>
        </section>

        {/* Features Preview */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Why Rolodink?
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Stop forgetting conversations. Organize your network the right way.
            </p>
          </div>

          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary" />
                <CardTitle>Keep track of your network</CardTitle>
                <CardDescription>
                  Save notes on every LinkedIn connection
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-primary" />
                <CardTitle>Remember conversations</CardTitle>
                <CardDescription>
                  What did you discuss? Where did you meet?
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-primary" />
                <CardTitle>Smarter follow-ups</CardTitle>
                <CardDescription>
                  No more missed commitments or lost contacts
                </CardDescription>
              </CardHeader>
            </Card>
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

        {/* FAQ */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col space-y-4">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-5xl text-center">FAQ</h2>
            <div className="rounded-lg border p-6 bg-background">
              <p className="font-semibold">Why Rolodink? Aren’t there enough CRMs?</p>
              <p className="mt-2 text-muted-foreground">
                CRMs are for sales. Rolodink is for human connections. It’s the digital version of what you used to write on the back of a business card — simple, personal, and right where you need it: inside LinkedIn.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
              Get started today
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Install Rolodink and transform how you manage your LinkedIn network.
            </p>
            <Button asChild size="lg" className="mt-4">
              <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                Add to Chrome - Free
              </a>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}


