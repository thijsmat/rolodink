import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CtaSectionProps {
  children: ReactNode
  className?: string
  alignment?: 'center' | 'left' | 'right'
  direction?: 'horizontal' | 'vertical' | 'responsive'
  spacing?: 'sm' | 'md' | 'lg'
}

export function CtaSection({ 
  children, 
  className,
  alignment = 'center',
  direction = 'responsive',
  spacing = 'md'
}: CtaSectionProps) {
  const alignmentClasses = {
    center: 'justify-center',
    left: 'justify-start', 
    right: 'justify-end'
  }

  const directionClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col',
    responsive: 'flex-col sm:flex-row'
  }

  const spacingClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6'
  }

  return (
    <div className={cn(
      "flex items-center",
      alignmentClasses[alignment],
      directionClasses[direction],
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  )
}
