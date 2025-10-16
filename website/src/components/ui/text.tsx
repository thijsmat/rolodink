import * as React from "react"
import { cn } from "@/lib/utils"

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'heading' | 'subheading' | 'body' | 'caption' | 'lead'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
  align?: 'left' | 'center' | 'right' | 'justify'
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ 
    className, 
    variant = 'body', 
    size, 
    weight, 
    align, 
    as, 
    children, 
    ...props 
  }, ref) => {
    // Determine the HTML element based on variant and as prop
    const getElement = () => {
      if (as) return as
      switch (variant) {
        case 'heading': return 'h2'
        case 'subheading': return 'h3'
        case 'lead': return 'p'
        default: return 'p'
      }
    }

    const Element = getElement() as keyof JSX.IntrinsicElements

    // Variant-based styling
    const variantClasses = {
      heading: "font-playfair font-bold text-navy leading-tight tracking-tight",
      subheading: "font-playfair font-semibold text-navy leading-tight",
      body: "font-inter text-charcoal leading-relaxed",
      caption: "font-inter text-charcoal/70 leading-normal",
      lead: "font-inter text-lg text-charcoal leading-relaxed"
    }

    // Size classes (override variant defaults if provided)
    const sizeClasses = {
      xs: "text-xs",
      sm: "text-sm", 
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
      "5xl": "text-5xl",
      "6xl": "text-6xl",
      "7xl": "text-7xl"
    }

    // Weight classes
    const weightClasses = {
      light: "font-light",
      normal: "font-normal",
      medium: "font-medium", 
      semibold: "font-semibold",
      bold: "font-bold"
    }

    // Alignment classes
    const alignClasses = {
      left: "text-left",
      center: "text-center", 
      right: "text-right",
      justify: "text-justify"
    }

    // Default sizes for variants if not overridden
    const defaultSize = size || (
      variant === 'heading' ? '4xl' :
      variant === 'subheading' ? '2xl' :
      variant === 'lead' ? 'lg' :
      'base'
    )

    return React.createElement(
      Element,
      {
        ref,
        className: cn(
          variantClasses[variant],
          sizeClasses[defaultSize],
          weight && weightClasses[weight],
          align && alignClasses[align],
          className
        ),
        ...props
      },
      children
    )
  }
)

Text.displayName = "Text"

export { Text }
