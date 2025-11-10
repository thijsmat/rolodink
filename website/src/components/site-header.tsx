"use client";

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, Moon, Sun } from 'lucide-react'
import { cn, getExtensionUrl } from '@/lib/utils'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

const EXTENSION_URL = getExtensionUrl();

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
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navLinks.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink
                  href={link.href}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "text-sm text-azure hover:text-azure/80 bg-transparent hover:bg-azure/5"
                  )}
                >
                  {link.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right: Theme Toggle + CTA + Mobile Menu */}
        <div className="flex items-center justify-end gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-azure/5 transition-colors duration-200 ease-out"
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
              Gratis Installeren - 30 seconden
            </a>
          </Button>

          {/* Mobile Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6 text-azure" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm text-azure hover:text-azure/80 transition-colors duration-200 ease-out py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <Button
                  asChild
                  className="w-full bg-azure hover:bg-azure/90 text-white text-sm font-medium rounded-lg mt-4"
                >
                  <a href={EXTENSION_URL} target="_blank" rel="noreferrer">
                    Gratis Installeren - 30 seconden
                  </a>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
