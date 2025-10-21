import Hero from "@/components/sections/hero"
import Features from "@/components/sections/features"
import Testimonials from "@/components/sections/testimonials"
import FAQ from "@/components/sections/faq"
import CTA from "@/components/sections/cta"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <Features />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>

      <SiteFooter />
    </div>
  )
}