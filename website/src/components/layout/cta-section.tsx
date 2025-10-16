import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CtaSectionProps {
  children: ReactNode
  className?: string
}

export function CtaSection({ children, className }: CtaSectionProps) {
  return (
    <div className={cn(
      "flex justify-center gap-4",
      "flex-col sm:flex-row",
      "items-center",
      className
    )}>
      {children}
    </div>
  )
}
