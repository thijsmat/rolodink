import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageSectionProps {
  children: ReactNode
  className?: string
  background?: 'white' | 'gray' | 'paper'
}

export function PageSection({ 
  children, 
  className, 
  background = 'white' 
}: PageSectionProps) {
  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    paper: 'paper-texture'
  }

  return (
    <section className={cn(
      "py-12 md:py-16",
      backgroundClasses[background],
      className
    )}>
      {children}
    </section>
  )
}
