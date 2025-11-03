import Hero from "@/components/sections/hero"
import Features from "@/components/sections/features"
import Testimonials from "@/components/sections/testimonials"
import FAQ from "@/components/sections/faq"
import CTA from "@/components/sections/cta"
import { SiteFooter } from "@/components/site-footer"

export default function HomePage() {
  return (
    <>
      <main className="flex-1 pt-16">
        <Hero />
        <Features />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <SiteFooter />
    </>
  )
}