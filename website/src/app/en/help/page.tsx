import Link from 'next/link'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Help', description: 'FAQ and troubleshooting for Rolodink.' }

export default function HelpPage() {
  return (
    <>
      
      <main className="flex-1 pt-16">
        <section className="container space-y-6 py-8 md:py-12 lg:py-24 text-center">
          <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">Help & FAQ</h1>
          <p className="max-w-[58rem] mx-auto text-muted-foreground">Issues with install or usage? Find the most common fixes below.</p>
        </section>
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto grid justify-center gap-6 md:max-w-[64rem]">
            <Card><CardHeader><CardTitle>Installation</CardTitle><CardDescription>Install from the Chrome Web Store.</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground space-y-2"><p>1. Go to the <Link href="/en/download" className="text-primary underline">download</Link> page and click Add to Chrome.</p><p>2. Confirm in the Chrome Web Store.</p><p>3. Open LinkedIn and visit a profile.</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Button not visible on LinkedIn</CardTitle><CardDescription>LinkedIn pages are SPA and load dynamically.</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground space-y-2"><ul className="list-disc list-inside space-y-1"><li>Refresh the profile page.</li><li>Wait 1–2 seconds after load; the button appears after profile CTAs.</li><li>Disable content blockers for linkedin.com.</li></ul></CardContent></Card>
            <Card><CardHeader><CardTitle>Permissions</CardTitle><CardDescription>What permissions does Rolodink use?</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground space-y-2"><ul className="list-disc list-inside space-y-1"><li><strong>LinkedIn access</strong> to show the button.</li><li><strong>Local storage</strong> for settings/UI.</li><li>No tracking in the extension.</li></ul></CardContent></Card>
            <Card><CardHeader><CardTitle>Contact</CardTitle><CardDescription>Need help? Get in touch.</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground space-y-3"><p>Email: <a href="mailto:hello@rolodink.app" className="text-primary underline">hello@rolodink.app</a></p><div className="flex gap-3"><Button asChild size="sm"><Link href="/en/download">Download</Link></Button><Button asChild size="sm" variant="outline"><Link href="/en/how-it-works">How it works</Link></Button></div></CardContent></Card>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}


