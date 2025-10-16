"use client"
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gold/20 bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/60 shadow-sm">
      <div className="container flex h-16 max-w-4xl items-center">
        {/* Left: Logo */}
        <Link className="mr-8 flex items-center space-x-2" href="/">
          <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
            <span className="text-cream font-bold text-lg font-playfair">R</span>
          </div>
          <span className="font-playfair text-xl font-bold text-navy">Rolodink</span>
        </Link>

        {/* Desktop Nav (right aligned) */}
        <nav className="ml-auto hidden md:flex items-center space-x-8 text-sm font-medium">
          <Link className="transition-colors hover:text-navy/80 text-charcoal/70 font-inter" href="/">
            Home
          </Link>
          <Link className="transition-colors hover:text-navy/80 text-charcoal/70 font-inter" href="/features">
            Features
          </Link>
          <Link className="transition-colors hover:text-navy/80 text-charcoal/70 font-inter" href="/help">
            Help
          </Link>
          <Link className="transition-colors hover:text-navy/80 text-charcoal/70 font-inter" href="/privacy">
            Privacy
          </Link>
          <Link className="transition-colors hover:text-navy/80 text-charcoal/70 font-inter" href="/terms">
            Terms
          </Link>
          <Button asChild variant="vintage" size="sm">
            <Link href="/download">Download</Link>
          </Button>
        </nav>

        {/* Mobile: Hamburger button */}
        <button
          aria-label="Open navigation menu"
          className="ml-auto inline-flex items-center justify-center rounded-lg p-2 hover:bg-navy/10 text-navy md:hidden transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile menu drawer */}
      {open && (
        <div className="md:hidden border-t border-gold/20 bg-cream/95 backdrop-blur">
          <nav className="container py-4 flex flex-col space-y-2">
            <Link 
              className="px-4 py-3 rounded-lg hover:bg-navy/10 text-charcoal font-inter transition-colors" 
              href="/" 
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <Link 
              className="px-4 py-3 rounded-lg hover:bg-navy/10 text-charcoal font-inter transition-colors" 
              href="/features" 
              onClick={() => setOpen(false)}
            >
              Features
            </Link>
            <Link 
              className="px-4 py-3 rounded-lg hover:bg-navy/10 text-charcoal font-inter transition-colors" 
              href="/help" 
              onClick={() => setOpen(false)}
            >
              Help
            </Link>
            <Link 
              className="px-4 py-3 rounded-lg hover:bg-navy/10 text-charcoal font-inter transition-colors" 
              href="/privacy" 
              onClick={() => setOpen(false)}
            >
              Privacy
            </Link>
            <Link 
              className="px-4 py-3 rounded-lg hover:bg-navy/10 text-charcoal font-inter transition-colors" 
              href="/terms" 
              onClick={() => setOpen(false)}
            >
              Terms
            </Link>
            <div className="pt-2">
              <Button asChild variant="vintage" size="sm" className="w-full">
                <Link href="/download" onClick={() => setOpen(false)}>
                  Download
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
