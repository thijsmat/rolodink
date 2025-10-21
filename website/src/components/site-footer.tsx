import * as React from "react";
import Link from "next/link";

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
                className="w-9 h-9 rounded-full bg-azure/5 hover:bg-azure/10 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 text-azure" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.29 20v-7.752H5.5V9.276h2.79V7.079c0-2.761 1.692-4.268 4.154-4.268 1.18 0 2.194.088 2.49.127v2.888h-1.71c-1.342 0-1.592.638-1.592 1.571v2.056h3.183l-2.771 3.108v7.768h-3.244z" />
                </svg>
              </a>
              <a
                href="https://twitter.com/matthijsgoes"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-azure/5 hover:bg-azure/10 flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4 text-azure" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-azure/5 hover:bg-azure/10 flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 text-azure" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18.5 2a1.5 1.5 0 011.5 1.5v13A1.5 1.5 0 0118.5 18h-17A1.5 1.5 0 010 16.5v-13A1.5 1.5 0 011.5 2h17M6.172 9.05a1.46 1.46 0 00-1.459-1.479H3.46a1.46 1.46 0 00-1.46 1.479v7.325h2.252V9.05zm5.477 0a1.459 1.459 0 00-1.458-1.479h-1.253a1.459 1.459 0 00-1.459 1.479v7.325h2.252V9.05zM17.05 7.571h-2.252v7.325h2.252v-7.325zM4.3 3.571A1.286 1.286 0 113.014 4.857 1.286 1.286 0 014.3 3.571zm12.752 3.479a1.459 1.459 0 00-1.459-1.479h-1.252a1.459 1.459 0 00-1.459 1.479v7.325h2.252v-7.325zm-7.325-1.479h-1.253a1.46 1.46 0 00-1.459 1.479v7.325h2.252V9.05z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="font-semibold text-azure mb-4">Product</h3>
            <nav className="space-y-3">
              <Link href="#features" className="block text-sm text-grey hover:text-azure transition-colors">
                Features
              </Link>
              <a href="#" className="block text-sm text-grey hover:text-azure transition-colors">
                Pricing
              </a>
              <a href="#" className="block text-sm text-grey hover:text-azure transition-colors">
                Changelog
              </a>
              <a href="#" className="block text-sm text-grey hover:text-azure transition-colors">
                Roadmap
              </a>
            </nav>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="font-semibold text-azure mb-4">Support</h3>
            <nav className="space-y-3">
              <Link href="#faq" className="block text-sm text-grey hover:text-azure transition-colors">
                FAQ
              </Link>
              <a href="#" className="block text-sm text-grey hover:text-azure transition-colors">
                Help Center
              </a>
              <a href="#" className="block text-sm text-grey hover:text-azure transition-colors">
                Contact
              </a>
              <Link href="/privacy" className="block text-sm text-grey hover:text-azure transition-colors">
                Privacy Policy
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
            <a href="#" className="text-sm text-grey hover:text-azure transition-colors">
              Terms of Service
            </a>
            <a href="/privacy" className="text-sm text-grey hover:text-azure transition-colors">
              Privacy Policy
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
