"use client"
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Left: Logo */}
        <Link className="mr-4 flex items-center space-x-2" href="/">
          <Image
            src="/logo.png"
            alt="Rolodink"
            width={140}
            height={28}
            priority
          />
        </Link>

        {/* Desktop Nav (right aligned) */}
        <nav className="ml-auto hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/">
            Home
          </Link>
          <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/features">
            Features
          </Link>
          <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/help">
            Help
          </Link>
          <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/privacy">
            Privacy
          </Link>
          <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/terms">
            Terms
          </Link>
          <Button asChild>
            <Link href="/download">Download</Link>
          </Button>
        </nav>

        {/* Mobile: Hamburger button */}
        <button
          aria-label="Open navigation menu"
          className="ml-auto inline-flex items-center justify-center rounded-md p-2 hover:bg-accent md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile menu drawer */}
      {open && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-2 flex flex-col space-y-1">
            <Link className="px-2 py-2 rounded hover:bg-accent" href="/" onClick={() => setOpen(false)}>Home</Link>
            <Link className="px-2 py-2 rounded hover:bg-accent" href="/features" onClick={() => setOpen(false)}>Features</Link>
            <Link className="px-2 py-2 rounded hover:bg-accent" href="/help" onClick={() => setOpen(false)}>Help</Link>
            <Link className="px-2 py-2 rounded hover:bg-accent" href="/privacy" onClick={() => setOpen(false)}>Privacy</Link>
            <Link className="px-2 py-2 rounded hover:bg-accent" href="/terms" onClick={() => setOpen(false)}>Terms</Link>
            <Link className="px-2 py-2 rounded hover:bg-accent font-medium" href="/download" onClick={() => setOpen(false)}>Download</Link>
          </nav>
        </div>
      )}
    </header>
  )
}
