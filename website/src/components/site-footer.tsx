import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Gemaakt door{' '}
            <Link
              href="https://twitter.com/matthijsgoes"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Matthijs
            </Link>
            . Een moderne rolodex voor je LinkedIn netwerk.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Voorwaarden
          </Link>
          <Link
            href="/disclaimer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Disclaimer
          </Link>
        </div>
      </div>
    </footer>
  )
}
