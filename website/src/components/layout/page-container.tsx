import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  spacing?: 'none' | 'sm' | 'md' | 'lg'
}

export function PageContainer({ 
  children, 
  className, 
  size = 'md',
  spacing = 'none'
}: PageContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none'
  }

  const spacingClasses = {
    none: '',
    sm: 'space-y-4',
    md: 'space-y-8',
    lg: 'space-y-12'
  }

  return (
    <div className={cn(
      "container mx-auto px-6",
      sizeClasses[size],
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  )
}
