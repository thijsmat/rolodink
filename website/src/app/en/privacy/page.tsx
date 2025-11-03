import Link from 'next/link'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'Privacy Policy', description: 'Privacy policy for Rolodink.' }

export default function PrivacyPage() {
  return (
    <>
      
      <main className="flex-1 pt-16">
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-4 text-center">
              <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: 14 October 2025</p>
            </div>
            <Card>
              <CardHeader><CardTitle>Privacy is our priority</CardTitle></CardHeader>
              <CardContent className="space-y-6 text-muted-foreground">
                <p>Rolodink is a browser extension that lets you save personal notes on LinkedIn profiles. Your data remains yours and under your control.</p>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Data we collect</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Account & notes (extension):</strong> notes and minimal account data (if you register/login) are stored securely in a Supabase database. The API is hosted on Vercel.</li>
                    <li><strong>Sync:</strong> cloud storage enables access across devices and after re‑installing.</li>
                    <li><strong>Technical/usage:</strong> no tracking, profiling or commercial use inside the extension.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Permissions & access (extension)</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>activeTab:</strong> temporary access after user interaction to show the note button.</li>
                    <li><strong>Host permissions:</strong> linkedin.com only during usage.</li>
                    <li><strong>Scripting:</strong> injected only on LinkedIn profiles after user action.</li>
                    <li><strong>Storage:</strong> notes are stored centrally in Supabase; local storage may be used for settings/sessions.</li>
                    <li><strong>Tabs:</strong> used to activate the extension on the right profile, not for data collection.</li>
                    <li><strong>Third‑party code:</strong> open‑source libraries only; no sharing of user data.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Security</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Data is stored in Supabase with modern security controls.</li>
                    <li>Backend/API runs on Vercel; connections are encrypted.</li>
                    <li>We aim to comply with relevant EU privacy regulations.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Website vs extension</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Website (rolodink.app):</strong> privacy‑friendly analytics (Plausible, Vercel Web Analytics) for aggregated usage. No PII profiling or sale.</li>
                    <li><strong>Extension:</strong> no analytics in the extension.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Your rights</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Export or delete your data. Contact support until a self‑service portal is available.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Third parties</h3>
                  <p>We do not share data with advertisers. Infrastructure: Supabase (database) and Vercel (hosting/deploy).</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Changes</h3>
                  <p>We will announce changes via in‑extension update notices and on this page.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Contact</h3>
                  <p>Email: <Link href="mailto:hello@rolodink.app" className="text-primary hover:underline">hello@rolodink.app</Link></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}


