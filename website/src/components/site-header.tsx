"use client";

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

const EXTENSION_URL = process.env.NEXT_PUBLIC_EXTENSION_URL || "https://chrome.google.com/webstore/detail/rolodink/...";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "Hoe het werkt" },
  { href: "/help", label: "Help" },
];

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-playfair text-2xl font-bold text-azure">
            Rolodink
          </span>
        </Link>

        {/* Desktop Nav (right aligned) */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href as any}
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA and Mobile Menu Toggle */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button asChild className="hidden md:inline-flex" variant="default">
            <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
              Add to Chrome - Gratis
            </a>
          </Button>
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="container flex flex-col space-y-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href as any}
                className="text-foreground/80"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button asChild variant="default" className="w-full">
              <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                Add to Chrome - Gratis
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
