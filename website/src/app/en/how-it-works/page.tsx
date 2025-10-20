import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Download, FileText, Users, ArrowRight, CheckCircle } from 'lucide-react'

export const metadata = { title: 'How it works', description: 'Learn how Rolodink works in 3 simple steps.' }

const steps = [
  { number: '01', icon: Download, title: 'Install the extension', description: 'Add Rolodink to your browser in 30 seconds.', details: ['Click “Add to Chrome”','Confirm installation','Open LinkedIn'] },
  { number: '02', icon: FileText, title: 'Add notes', description: 'Visit a LinkedIn profile and click “Add to CRM”.', details: ['Open a LinkedIn profile','Click the Rolodink button','Add context and notes'] },
  { number: '03', icon: Users, title: 'Organize your network', description: 'See all your notes in one place. Search, filter, manage.', details: ['Open Rolodink popup','View your overview','Search and filter contacts'] },
]

export default function HowItWorksPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">How does Rolodink work?</h1>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">In three simple steps, turn your LinkedIn into a structured network.</p>
          </div>
        </section>
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto grid justify-center gap-8 md:max-w-[64rem]">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <Card className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start space-x-4">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">{step.number}</div>
                        <div className="rounded-lg bg-primary/10 p-2"><step.icon className="h-6 w-6 text-primary" /></div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <CardTitle className="text-2xl">{step.title}</CardTitle>
                        <CardDescription className="text-base leading-relaxed">{step.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-20">
                    <ul className="space-y-2">
                      {step.details.map((d, di) => (
                        <li key={di} className="flex items-center space-x-2 text-sm"><CheckCircle className="h-4 w-4 text-green-500" /><span>{d}</span></li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                {i < steps.length - 1 && (<div className="flex justify-center py-4"><ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 md:rotate-0" /></div>)}
              </div>
            ))}
          </div>
        </section>
        <section className="container space-y-6 py-8 md:py-12 lg:py-24 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">Ready to start?</h2>
          <Button asChild size="lg"><Link href="/en/download">Download now</Link></Button>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}


