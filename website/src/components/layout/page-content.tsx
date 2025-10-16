import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContentProps {
  children: ReactNode
  className?: string
  maxWidth?: 'prose' | 'lg' | 'xl' | 'full'
}

export function PageContent({ 
  children, 
  className, 
  maxWidth = 'prose' 
}: PageContentProps) {
  const maxWidthClasses = {
    prose: 'max-w-prose mx-auto text-left',
    lg: 'max-w-lg mx-auto text-left',
    xl: 'max-w-xl mx-auto text-left',
    full: 'text-left'
  }

  return (
    <div className={cn(maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  )
}
