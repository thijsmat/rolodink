import { SiteFooter } from "@/components/site-footer";
import Hero from "@/components/sections/hero";
import Features from "@/components/sections/features";
import Testimonials from "@/components/sections/testimonials";
import HowItWorks from "@/components/sections/how-it-works";
import UseCases from "@/components/sections/use-cases";
import FAQ from "@/components/sections/faq";
import CTA from "@/components/sections/cta";

export default function HomePage() {
  return (
    <>
      <main className="flex-1">
        <Hero />
        <Features />
        <Testimonials />
        <HowItWorks />
        <UseCases />
        <FAQ />
        <CTA />
      </main>
      <SiteFooter />
    </>
  );
}
