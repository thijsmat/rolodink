import * as React from "react";
import Link from "next/link";
import { Facebook, Twitter, Linkedin } from 'lucide-react';

export function SiteFooter() {
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
              Breng de persoonlijke touch van business cards naar de digitale wereld. Onthoud waarom elke connectie waardevol is met Rolodink voor LinkedIn.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4 mt-6">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-azure/5 hover:bg-azure/10 flex items-center justify-center transition-colors duration-200 ease-out"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4 text-azure" />
              </a>
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
                href="#"
                className="w-9 h-9 rounded-full bg-azure/5 hover:bg-azure/10 flex items-center justify-center transition-colors duration-200 ease-out"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4 text-azure" />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-sm font-semibold text-azure mb-4">Product</h3>
            <nav className="space-y-3">
              <Link href="#features" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                Features
              </Link>
              <a href="#" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                Pricing
              </a>
              <a href="#" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                Changelog
              </a>
              <a href="#" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                Roadmap
              </a>
            </nav>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-sm font-semibold text-azure mb-4">Support</h3>
            <nav className="space-y-3">
              <Link href="#faq" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                FAQ
              </Link>
              <a href="#" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                Help Center
              </a>
              <a href="#" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                Contact
              </a>
              <Link href="/privacy" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                Privacy Policy
              </Link>
              <Link href="/security" className="block text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
                Security
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
            © {new Date().getFullYear()} Rolodink. Alle rechten voorbehouden.
          </p>
          <nav className="flex items-center gap-6">
            <a href="/terms" className="text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
              Terms of Service
            </a>
            <a href="/privacy" className="text-sm text-grey hover:text-azure transition-colors duration-200 ease-out">
              Privacy Policy
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
