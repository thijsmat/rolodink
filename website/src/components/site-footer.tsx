import * as React from "react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border/40 bg-background">
      <div className="container flex flex-col items-center justify-between space-y-4 py-10 md:h-24 md:flex-row md:py-0 md:space-y-0">
        {/* Left Side: Copyright */}
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Rolodink. Gemaakt door{" "}
            <a
              href="https://twitter.com/matthijsgoes"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4 hover:text-primary"
            >
              Matthijs
            </a>
            .
          </p>
        </div>

        {/* Right Side: Links */}
        <nav className="flex items-center space-x-4 md:space-x-6">
          <Link
            href="/privacy"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Terms
          </Link>
          <a
            href="https://twitter.com/matthijsgoes"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground transition-colors hover:text-primary"
            aria-label="Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
            </svg>
          </a>
        </nav>
      </div>
    </footer>
  );
}
