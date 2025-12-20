"use client";

import * as React from "react";
import { Link } from '@/navigation';
import { Twitter, Linkedin } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function SiteFooter() {
  const t = useTranslations('Footer');

  return (
    <footer className="w-full bg-background border-t border-azure/10">
      <div className="max-w-[1136px] mx-auto px-8 py-16">
        {/* Top Section: Brand + Description + Social */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white to-white/80 dark:from-azure/20 dark:to-azure/10 flex items-center justify-center flex-shrink-0">
                <span className="text-azure font-semibold text-base">R</span>
              </div>
              <span className="font-playfair font-semibold text-xl text-azure">
                Rolodink
              </span>
            </div>
            <p className="text-sm text-grey leading-relaxed max-w-xs">
              {t('description')}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://twitter.com/matthijsgoes"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-azure/5 hover:bg-azure/10 flex items-center justify-center transition-colors duration-200 ease-out"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4 text-azure" />
              </a>
              <a
                href="https://bsky.app/profile/thijsmat.bsky.social"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-azure/5 hover:bg-azure/10 flex items-center justify-center transition-colors duration-200 ease-out"
                aria-label="Bluesky"
              >
                <svg className="h-4 w-4 text-azure" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.81 9.498 7.824 4.308 4.557-5.073 1.082-6.498-2.831-7.078-.139-.016-.277-.034-.415-.056.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.686 12 10.8Z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/rolodink/"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-azure/5 hover:bg-azure/10 flex items-center justify-center transition-colors duration-200 ease-out"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4 text-azure" />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-sm font-semibold text-azure mb-4">{t('sections.product')}</h3>
            <nav className="space-y-3">
              <Link href="/features" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                {t('links.features')}
              </Link>
              <Link href="/download" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                {t('links.download')}
              </Link>
              <Link href="/changelog" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                {t('links.changelog')}
              </Link>
            </nav>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-sm font-semibold text-azure mb-4">{t('sections.support')}</h3>
            <nav className="space-y-3">
              <Link href="/help" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                {t('links.faq')}
              </Link>
              <Link href="/help" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                {t('links.helpCenter')}
              </Link>
              <Link href="/help" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                {t('links.contact')}
              </Link>
              <Link href="/privacy" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                {t('links.privacy')}
              </Link>
              <Link href="/security" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                {t('links.security')}
              </Link>
            </nav>
          </div>

          {/* Empty for spacing */}
          <div></div>
        </div>

        {/* Divider */}
        <div className="h-px bg-azure/10 mb-8"></div>

        {/* Bottom Section: Copyright + Legal */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-grey">
            © {new Date().getFullYear()} Rolodink. {t('copyright')}
          </p>
          <nav className="flex items-center gap-6">
            <Link href="/terms" className="text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
              {t('links.terms')}
            </Link>
            <Link href="/privacy" className="text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
              {t('links.privacy')}
            </Link>
            <Link href="/disclaimer" className="text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
              {t('links.disclaimer')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
