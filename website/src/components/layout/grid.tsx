import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GridProps {
  children: ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  responsive?: boolean
}

export function Grid({ 
  children, 
  className, 
  cols = 3,
  gap = 'md',
  responsive = true
}: GridProps) {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8', 
    xl: 'gap-12'
  }

  const baseCols = `grid-cols-${cols}`
  
  // Responsive grid classes
  const responsiveClasses = responsive ? {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
  } : {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }

  return (
    <div className={cn(
      "grid",
      responsiveClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

interface GridItemProps {
  children: ReactNode
  className?: string
  span?: 1 | 2 | 3 | 4 | 5 | 6
}

export function GridItem({ 
  children, 
  className, 
  span = 1
}: GridItemProps) {
  const spanClasses = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3', 
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6'
  }

  return (
    <div className={cn(spanClasses[span], className)}>
      {children}
    </div>
  )
}
