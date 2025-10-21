"use client";

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, Moon, Sun } from 'lucide-react'

const EXTENSION_URL = process.env.NEXT_PUBLIC_EXTENSION_URL || "https://chrome.google.com/webstore/detail/rolodink/...";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check for saved theme preference or system preference
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(saved === 'dark' || (!saved && prefersDark));
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDark);
  };

  if (!isMounted) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 border-b border-azure/10">
      <div className="max-w-[1136px] mx-auto px-8 h-16 flex items-center justify-between">
        {/* Left: Logo with Badge */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white to-white/80 dark:from-azure/20 dark:to-azure/10 flex items-center justify-center flex-shrink-0">
            <span className="text-azure font-semibold text-base">R</span>
          </div>
          <span className="font-playfair font-semibold text-xl text-azure whitespace-nowrap">
            Rolodink
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-azure hover:text-azure/80 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Theme Toggle + CTA + Mobile Menu */}
        <div className="flex items-center justify-end gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-azure/5 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-azure" />
            ) : (
              <Moon className="h-4 w-4 text-azure" />
            )}
          </button>

          {/* Desktop CTA Button */}
          <Button
            asChild
            className="hidden md:inline-flex h-9 px-4 bg-azure hover:bg-azure/90 text-white text-sm font-medium rounded-lg"
          >
            <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
              Add to Chrome - Gratis
            </a>
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-1 hover:bg-azure/5 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-azure" />
            ) : (
              <Menu className="h-6 w-6 text-azure" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer with smooth animation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-azure/10 bg-background animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="max-w-[1136px] mx-auto px-8 py-4 space-y-4 flex flex-col">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-azure hover:text-azure/80 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Button
              asChild
              className="w-full h-9 bg-azure hover:bg-azure/90 text-white text-sm font-medium rounded-lg mt-2"
            >
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
