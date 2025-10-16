import * as React from "react"
import { cn } from "@/lib/utils"
import { Text } from "./text"

interface TestimonialCardProps {
  quote: string
  author: {
    name: string
    role: string
    company: string
  }
  className?: string
}

export function TestimonialCard({ quote, author, className }: TestimonialCardProps) {
  return (
    <div className={cn(
      "relative bg-gradient-to-br from-cream to-warm-gray rounded-2xl p-8 shadow-lg border border-gold/20 transition-all duration-300 hover:shadow-xl",
      className
    )}>
      {/* Quote icon */}
      <div className="absolute -top-4 -left-4 w-8 h-8 bg-gold rounded-full flex items-center justify-center shadow-lg">
        <svg className="w-4 h-4 text-navy" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V8a1 1 0 112 0v2.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      
      {/* Quote text */}
      <blockquote className="mb-6">
        <Text variant="body" className="text-charcoal leading-relaxed italic">
          "{quote}"
        </Text>
      </blockquote>
      
      {/* Author info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center">
          <span className="text-cream font-semibold text-lg">
            {author.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <Text variant="subheading" size="base" weight="semibold" className="text-navy">
            {author.name}
          </Text>
          <Text variant="caption" className="text-charcoal/70">
            {author.role} bij {author.company}
          </Text>
        </div>
      </div>
    </div>
  )
}
