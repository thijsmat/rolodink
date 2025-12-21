"use client";

import { Link } from '@/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteFooter } from '@/components/site-footer'
import {
  Users,
  MessageSquare,
  Calendar,
  FileText,
  Shield,
  Zap,
  Target,
  BarChart3,
  CheckCircle
} from 'lucide-react'
import { getExtensionUrl } from '@/lib/utils'
import { useTranslations } from 'next-intl';

const iconMap = [Users, MessageSquare, Calendar, FileText, Shield, Zap];

export default function FeaturesPage() {
  const t = useTranslations('FeaturesPage');
  const extensionUrl = getExtensionUrl();

  // Get features array from translations
  const features = Array.from({ length: 6 }, (_, i) => ({
    icon: iconMap[i],
    title: t(`features.${i}.title`),
    description: t(`features.${i}.description`),
    benefits: t.raw(`features.${i}.benefits`) as string[],
  }));

  return (
    <>
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="container mx-auto max-w-5xl py-16 md:py-24 lg:py-32">
          <div className="mx-auto flex flex-col items-center space-y-6 text-center">
            <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl md:text-6xl">
              {t('hero.title')}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-grey sm:text-xl">
              {t('hero.description')}
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto max-w-6xl pb-16 md:pb-24 lg:pb-32">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Card key={feature.title} className="flex flex-col border-azure/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-azure text-background">
                      <IconComponent className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <CardTitle className="font-playfair text-xl text-azure">{feature.title}</CardTitle>
                    <CardDescription className="text-grey/90">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start text-sm text-grey">
                          <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-gold" aria-hidden="true" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-azure/5 py-16 md:py-24">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="font-playfair text-3xl font-bold text-azure sm:text-4xl">
                {t('stats.title')}
              </h2>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
              <div className="flex flex-col items-center space-y-2">
                <Target className="h-8 w-8 text-azure" />
                <p className="text-4xl font-bold text-azure">100%</p>
                <p className="text-muted-foreground">{t('stats.focus')}</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <BarChart3 className="h-8 w-8 text-azure" />
                <p className="text-4xl font-bold text-azure">3x</p>
                <p className="text-muted-foreground">{t('stats.followUp')}</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Zap className="h-8 w-8 text-azure" />
                <p className="text-4xl font-bold text-azure">&lt;30s</p>
                <p className="text-muted-foreground">{t('stats.installTime')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto max-w-5xl py-16 md:py-24 lg:py-32">
          <div className="mx-auto flex max-w-3xl flex-col items-center space-y-6 text-center">
            <h2 className="font-playfair text-3xl font-bold text-azure sm:text-4xl">
              {t('cta.title')}
            </h2>
            <p className="text-lg leading-8 text-grey">
              {t('cta.description')}
            </p>
            <div className="flex gap-4">
              <Button asChild size="lg">
                <a href={extensionUrl} target="_blank" rel="noreferrer">
                  {t('cta.button')}
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/how-it-works">
                  {t('cta.demo')}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
