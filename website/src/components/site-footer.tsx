import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-gold/20 bg-gradient-to-br from-cream to-warm-gray">
      <div className="container max-w-4xl mx-auto px-6 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
                <span className="text-cream font-bold text-lg font-playfair">R</span>
              </div>
              <span className="font-playfair text-xl font-bold text-navy">Rolodink</span>
            </div>
            <p className="text-charcoal/70 font-inter leading-relaxed max-w-md">
              Een moderne rolodex voor je LinkedIn netwerk. Bewaar notities bij je connecties en vergeet nooit meer waar je iemand ontmoette.
            </p>
          </div>
          
          {/* Quick links */}
          <div>
            <h3 className="font-playfair text-lg font-semibold text-navy mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-charcoal/70 hover:text-navy font-inter transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/download" className="text-charcoal/70 hover:text-navy font-inter transition-colors">
                  Download
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-charcoal/70 hover:text-navy font-inter transition-colors">
                  Help
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal links */}
          <div>
            <h3 className="font-playfair text-lg font-semibold text-navy mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-charcoal/70 hover:text-navy font-inter transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-charcoal/70 hover:text-navy font-inter transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-charcoal/70 hover:text-navy font-inter transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="border-t border-gold/20 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-center text-sm text-charcoal/60 font-inter md:text-left">
              © 2024 Rolodink. Gemaakt door{' '}
              <Link
                href="https://twitter.com/matthijsgoes"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-navy hover:text-navy/80 underline underline-offset-4 transition-colors"
              >
                Matthijs
              </Link>
              . Alle rechten voorbehouden.
            </p>
            
            <div className="flex items-center space-x-6">
              <Link
                href="https://twitter.com/matthijsgoes"
                target="_blank"
                rel="noreferrer"
                className="text-charcoal/60 hover:text-navy transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link
                href="https://github.com/thijsmat/rolodink"
                target="_blank"
                rel="noreferrer"
                className="text-charcoal/60 hover:text-navy transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
