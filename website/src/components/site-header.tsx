import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" href="/">
            <Image
              src="/logo.png"
              alt="Rolodink"
              width={140}
              height={28}
              priority
            />
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/features"
            >
              Features
            </Link>
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/how-it-works"
            >
              Hoe werkt het?
            </Link>
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/download"
            >
              Download
            </Link>
          </nav>
        </div>
        <Button asChild className="ml-auto">
          <Link href="/download">
            Installeren
          </Link>
        </Button>
      </div>
    </header>
  )
}
