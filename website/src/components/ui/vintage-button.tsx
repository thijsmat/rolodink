"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type VintageButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
}

export function VintageButton({ className, children, ...props }: VintageButtonProps) {
  return (
    <button
      className={cn(
        "vintage-button inline-flex items-center justify-center whitespace-nowrap transition-all duration-200",
        "hover:shadow-lg active:translate-y-[1px]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default VintageButton



