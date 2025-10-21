import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import Hero from "@/components/sections/hero";
import Features from "@/components/sections/features";
import Testimonials from "@/components/sections/testimonials";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-16">
        <Hero />
        <Features />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <SiteFooter />
    </>
  );
}
