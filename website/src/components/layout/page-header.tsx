import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  children: ReactNode
  className?: string
  alignment?: 'center' | 'left'
  spacing?: 'sm' | 'md' | 'lg'
}

export function PageHeader({ 
  children, 
  className, 
  alignment = 'center',
  spacing = 'lg'
}: PageHeaderProps) {
  const spacingClasses = {
    sm: 'space-y-4 mb-8',
    md: 'space-y-6 mb-12', 
    lg: 'space-y-8 mb-16'
  }

  return (
    <div className={cn(
      spacingClasses[spacing],
      alignment === 'center' ? 'text-center' : 'text-left',
      className
    )}>
      {children}
    </div>
  )
}
