import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ProfessionGridProps {
  children: ReactNode
  className?: string
}

export function ProfessionGrid({ children, className }: ProfessionGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-2 md:grid-cols-3 gap-4 justify-items-center",
      className
    )}>
      {children}
    </div>
  )
}
