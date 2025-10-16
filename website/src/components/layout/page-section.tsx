import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageSectionProps {
  children: ReactNode
  className?: string
  background?: 'white' | 'gray' | 'paper' | 'dark' | 'gradient'
  padding?: 'sm' | 'md' | 'lg' | 'xl'
  fullHeight?: boolean
}

export function PageSection({ 
  children, 
  className, 
  background = 'white',
  padding = 'md',
  fullHeight = false
}: PageSectionProps) {
  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50/50',
    paper: 'paper-texture',
    dark: 'bg-slate-900 text-white',
    gradient: 'bg-gradient-to-br from-slate-50 to-gray-100'
  }

  const paddingClasses = {
    sm: 'py-8 md:py-12',
    md: 'py-12 md:py-16',
    lg: 'py-16 md:py-20',
    xl: 'py-20 md:py-24'
  }

  return (
    <section className={cn(
      "relative overflow-hidden",
      paddingClasses[padding],
      backgroundClasses[background],
      fullHeight && "min-h-screen flex items-center",
      className
    )}>
      {children}
    </section>
  )
}
