import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContentProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'prose' | 'lg' | 'xl' | '2xl' | 'full'
  alignment?: 'left' | 'center' | 'right'
}

export function PageContent({ 
  children, 
  className, 
  maxWidth = 'prose',
  alignment = 'left'
}: PageContentProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    prose: 'max-w-prose',
    lg: 'max-w-lg',
    xl: 'max-w-xl', 
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  return (
    <div className={cn(
      maxWidthClasses[maxWidth],
      alignmentClasses[alignment],
      maxWidth !== 'full' && 'mx-auto',
      className
    )}>
      {children}
    </div>
  )
}
