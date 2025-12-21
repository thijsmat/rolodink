"use client";

import { SiteFooter } from "@/components/site-footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { getExtensionUrl } from "@/lib/utils";
import { useTranslations } from 'next-intl';

interface FaqItem {
  question: string;
  answer: string;
}

export default function HelpPage() {
  const t = useTranslations('HelpPage');
  const extensionUrl = getExtensionUrl();

  // Get FAQ items from translations
  const faqItems = t.raw('faq') as FaqItem[];

  return (
    <>
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="container mx-auto max-w-4xl py-16 text-center md:py-24 lg:py-32">
          <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl lg:text-6xl">
            {t('title')}
          </h1>
          <p className="mt-6 text-lg leading-8 text-grey sm:text-xl">
            {t('description')}
          </p>
        </section>

        {/* FAQ Accordion Section */}
        <section className="container mx-auto max-w-3xl pb-16 md:pb-24 lg:pb-32">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger className="text-left font-playfair text-lg text-azure hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-grey">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Final CTA */}
        <section className="bg-azure/5">
          <div className="container mx-auto max-w-4xl py-16 text-center md:py-24">
            <h2 className="font-playfair text-3xl font-bold tracking-tight text-azure sm:text-4xl">
              {t('cta.title')}
            </h2>
            <p className="mt-4 text-lg leading-8 text-grey">
              {t('cta.description')}
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <a href={extensionUrl} target="_blank" rel="noreferrer">
                  {t('cta.button')}
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}