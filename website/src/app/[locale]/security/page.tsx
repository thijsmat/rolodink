"use client";

import { SiteFooter } from "@/components/site-footer";
import { useTranslations } from 'next-intl';

export default function SecurityPage() {
  const t = useTranslations('SecurityPage');
  const notice = t('notice');

  const sections = t.raw('sections') as {
    title: string;
    paragraphs: string[];
    email?: boolean;
  }[];

  return (
    <>
      <main className="flex-1 pt-16">
        <section className="container py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl">
            {notice && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      {notice}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl mb-4">
              {t('title')}
            </h1>
            <p className="text-lg text-grey mb-16">
              {t('lastUpdated')}: {t('updatedOn')}
            </p>

            <div
              className="prose prose-lg max-w-none 
                         text-grey 
                         prose-headings:font-playfair prose-headings:font-semibold prose-headings:text-azure 
                         prose-a:text-link-blue prose-a:underline-offset-4 hover:prose-a:text-link-blue/80
                         prose-strong:text-azure"
            >
              <p>{t('intro')}</p>

              {sections.map((section) => (
                <section key={section.title}>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.email && (
                    <p>
                      <a href="mailto:hallo@rolodink.app">hallo@rolodink.app</a>
                    </p>
                  )}
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
