"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface AccordionItemProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function AccordionItem({ title, children, defaultOpen = false, className }: AccordionItemProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div className={cn("border border-gold/20 rounded-lg overflow-hidden", className)}>
      <button
        className="w-full px-6 py-4 text-left bg-gradient-to-r from-cream to-warm-gray hover:from-cream/80 hover:to-warm-gray/80 transition-all duration-200 flex items-center justify-between group"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="font-playfair text-lg font-semibold text-navy group-hover:text-navy/80 transition-colors">
          {title}
        </span>
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-navy transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-6 py-4 bg-white border-t border-gold/10">
          {children}
        </div>
      </div>
    </div>
  )
}

interface AccordionProps {
  children: React.ReactNode
  className?: string
}

export function Accordion({ children, className }: AccordionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  )
}
