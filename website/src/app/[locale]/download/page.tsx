"use client";

import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getExtensionUrl } from "@/lib/utils";
import { Chrome } from "lucide-react";
import { Edge, Firefox } from "@/components/icons";
import { useTranslations } from 'next-intl';

export default function DownloadPage() {
  const t = useTranslations('DownloadPage');
  const extensionUrl = getExtensionUrl();

  return (
    <>
      <main className="flex flex-1 items-center justify-center pt-16">
        <section className="container py-16 text-center md:py-24 lg:py-32">
          <div className="mx-auto max-w-2xl">
            <h1 className="font-playfair text-4xl font-bold tracking-tight text-azure sm:text-5xl lg:text-6xl">
              {t('title')}
            </h1>
            <p className="mt-6 text-lg leading-8 text-grey sm:text-xl">
              {t('description')}
            </p>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 max-w-2xl mx-auto">
              {/* Chrome - Primary */}
              <Button asChild size="lg" className="h-16 px-8 text-lg w-full">
                <a href={extensionUrl} target="_blank" rel="noreferrer">
                  <Chrome className="mr-2 h-6 w-6" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{t('chrome')}</span>
                    <span className="text-xs font-normal opacity-90">{t('version')}</span>
                  </div>
                </a>
              </Button>

              {/* Edge - Secondary */}
              <Button asChild size="lg" className="h-16 px-8 text-lg w-full">
                <a href="https://microsoftedge.microsoft.com/addons/detail/ihcocnphebdemiipmoedinojihpbcmmf" target="_blank" rel="noreferrer">
                  <Edge className="mr-2 h-6 w-6" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{t('edge')}</span>
                    <span className="text-xs font-normal opacity-90">{t('version')}</span>
                  </div>
                </a>
              </Button>

              {/* Firefox - Secondary */}
              <Button asChild size="lg" className="h-16 px-8 text-lg w-full">
                <a href="https://addons.mozilla.org/addon/rolodink/" target="_blank" rel="noreferrer">
                  <Firefox className="mr-2 h-6 w-6" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{t('firefox')}</span>
                    <span className="text-xs font-normal opacity-90">{t('version')}</span>
                  </div>
                </a>
              </Button>

              {/* GitHub - Secondary */}
              <Button asChild variant="outline" size="lg" className="h-16 px-8 text-lg w-full border-azure/20 hover:bg-azure/5">
                <a href="https://github.com/thijsmat/rolodink/releases/latest" target="_blank" rel="noreferrer">
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-azure">{t('github')}</span>
                    <span className="text-xs font-normal text-grey">{t('githubSub')}</span>
                  </div>
                </a>
              </Button>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              {t('footer')}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}