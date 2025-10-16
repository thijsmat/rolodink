import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  children: ReactNode
  className?: string
  alignment?: 'center' | 'left'
}

export function PageHeader({ 
  children, 
  className, 
  alignment = 'center' 
}: PageHeaderProps) {
  return (
    <div className={cn(
      "space-y-6 mb-12",
      alignment === 'center' ? 'text-center' : 'text-left',
      className
    )}>
      {children}
    </div>
  )
}
