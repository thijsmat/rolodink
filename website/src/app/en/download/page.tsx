import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Download, Chrome, Shield, Clock, CheckCircle, ExternalLink } from 'lucide-react'

export const metadata = { title: 'Download', description: 'Install the Rolodink browser extension.' }

const EXTENSION_URL = process.env.NEXT_PUBLIC_EXTENSION_URL || 'https://chrome.google.com/webstore/detail/rolodink/...'

export default function DownloadPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container space-y-6 py-8 md:py-12 lg:py-24 text-center">
          <Badge variant="secondary" className="rounded-full px-3 py-1">Free download</Badge>
          <h1 className="font-heading text-3xl leading-tight sm:text-3xl md:text-6xl">Download Rolodink</h1>
          <p className="max-w-[58rem] mx-auto text-muted-foreground">Install Rolodink and start organizing your LinkedIn network today.</p>
        </section>
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-8">
            <Card className="w-full max-w-lg">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto rounded-lg bg-primary/10 p-4 w-fit"><Chrome className="h-12 w-12 text-primary" /></div>
                <div>
                  <CardTitle className="text-2xl">Rolodink for Chrome</CardTitle>
                  <CardDescription className="text-base">Works with Chromium browsers (Chrome, Edge, Brave)</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button asChild size="lg" className="w-full">
                  <a href={EXTENSION_URL} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" />Add to Chrome - Free<ExternalLink className="ml-2 h-4 w-4" /></a>
                </Button>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 w-full max-w-2xl mx-auto">
                  {['Works inside LinkedIn','No account required','Privacy‑first','Local settings'].map((f)=> (
                    <div key={f} className="flex items-center space-x-2"><CheckCircle className="h-5 w-5 text-green-500" /><span className="text-sm">{f}</span></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 text-center">
            <Card><CardHeader><div className="mx-auto bg-primary/10 p-3 rounded-lg w-fit mb-4"><Shield className="h-8 w-8 text-primary" /></div><CardTitle>Privacy‑friendly</CardTitle><CardDescription>No tracking in the extension. Your data stays yours.</CardDescription></CardHeader></Card>
            <Card><CardHeader><div className="mx-auto bg-primary/10 p-3 rounded-lg w-fit mb-4"><Clock className="h-8 w-8 text-primary" /></div><CardTitle>Quick setup</CardTitle><CardDescription>Install in under a minute. Works instantly on LinkedIn.</CardDescription></CardHeader></Card>
            <Card><CardHeader><div className="mx-auto bg-primary/10 p-3 rounded-lg w-fit mb-4"><CheckCircle className="h-8 w-8 text-primary" /></div><CardTitle>Open source</CardTitle><CardDescription>Code available on GitHub for transparency.</CardDescription></CardHeader></Card>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}


