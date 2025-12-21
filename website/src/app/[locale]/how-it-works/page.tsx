"use client";

import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, User, Edit3, Search } from "lucide-react";
import { getExtensionUrl } from "@/lib/utils";
import { useTranslations } from 'next-intl';

const icons = [Download, User, Edit3, Search];

export default function HowItWorksPage() {
  const t = useTranslations('HowItWorksPage');
  const extensionUrl = getExtensionUrl();

  // Get steps from translations
  const steps = (t.raw('steps') as Array<{ title: string; description: string }>).map((step, index) => ({
    ...step,
    icon: icons[index],
  }));

  return (
    <>
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="container max-w-4xl py-16 text-center md:py-24 lg:py-32">
          <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl lg:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mt-6 text-lg leading-8 text-grey sm:text-xl">
            {t('hero.description')}
          </p>
        </section>

        {/* Step-by-step Section */}
        <section className="container max-w-6xl pb-16 md:pb-24 lg:pb-32">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <Card key={step.title} className="relative flex flex-col text-center border-azure/10">
                  <CardHeader>
                    <Badge
                      variant="outline"
                      className="absolute -top-4 left-1/2 -translate-x-1/2 border-gold bg-background px-3 py-1 text-sm font-semibold text-gold"
                    >
                      {t('stepLabel')} {index + 1}
                    </Badge>
                    <div className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-azure/5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-azure/10 text-azure">
                        <IconComponent className="h-6 w-6" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="mb-2 font-playfair text-xl text-azure">{step.title}</CardTitle>
                    <p className="text-sm leading-6 text-grey">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-azure/5">
          <div className="container max-w-4xl py-16 text-center md:py-24">
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