import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Users, MessageSquare, Calendar, FileText, Shield, Zap, Target, BarChart3 } from 'lucide-react'

export const metadata = { title: 'Features', description: 'Discover all capabilities of Rolodink.' }

const features = [
  { icon: Users, title: 'Network management', description: 'Save notes for every LinkedIn connection.', benefits: ['Automatic profile detection','Per‑contact notes','Search your network'] },
  { icon: MessageSquare, title: 'Conversation notes', description: 'Capture context and next steps.', benefits: ['Contextual notes','History','Follow‑up reminders'] },
  { icon: Calendar, title: 'Follow‑ups', description: 'Stay consistent and never miss a promise.', benefits: ['Smart reminders','Templates','Priorities'] },
  { icon: FileText, title: 'Structured data', description: 'Tags, companies, topics for overview.', benefits: ['Categorize contacts','Store company info','Search & filter'] },
  { icon: Shield, title: 'Privacy‑first', description: 'Your data remains yours.', benefits: ['No tracking in extension','Secure storage','Full control'] },
  { icon: Zap, title: 'Fast integration', description: 'Works directly inside LinkedIn.', benefits: ['One‑click install','Instantly available','No training needed'] },
]

export default function FeaturesPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container space-y-6 py-8 md:py-12 lg:py-24 text-center">
          <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">All features of Rolodink</h1>
          <p className="max-w-[58rem] mx-auto text-muted-foreground">Explore how Rolodink transforms your LinkedIn into a powerful, organized network.</p>
        </section>
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto grid justify-center gap-6 md:max-w-[64rem] md:grid-cols-2">
            {features.map((f, i) => (
              <Card key={i} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="rounded-lg bg-primary/10 p-2"><f.icon className="h-6 w-6 text-primary" /></div>
                    <div><CardTitle className="text-xl">{f.title}</CardTitle></div>
                  </div>
                  <CardDescription className="text-base">{f.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">{f.benefits.map((b, bi)=> (<li key={bi} className="flex items-center space-x-2 text-sm"><div className="h-1.5 w-1.5 rounded-full bg-primary" /><span>{b}</span></li>))}</ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section className="container space-y-6 py-8 md:py-12 lg:py-24 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">Why professionals choose Rolodink</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-2"><Target className="h-8 w-8 text-primary" /><div className="text-2xl font-bold">100%</div><div className="text-sm text-muted-foreground">Focused on LinkedIn</div></div>
            <div className="flex flex-col items-center space-y-2"><BarChart3 className="h-8 w-8 text-primary" /><div className="text-2xl font-bold">3x</div><div className="text-sm text-muted-foreground">Better follow‑ups</div></div>
            <div className="flex flex-col items-center space-y-2"><Zap className="h-8 w-8 text-primary" /><div className="text-2xl font-bold">30s</div><div className="text-sm text-muted-foreground">Install time</div></div>
          </div>
          <div className="mt-6"><Button asChild size="lg"><Link href="/en/download">Download now</Link></Button></div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}


