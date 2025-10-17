/**
 * Rolodink Design Tokens
 * Centralized design system values extracted from Figma
 */

export const colors = {
  // Primary Brand Colors
  navy: '#1B2951',
  cream: '#F7F5F0',
  gold: '#B8860B',
  linkedin: '#0066CC',
  charcoal: '#2D3748',
  warmGray: '#F5F5F4',
  
  // Enhanced Vintage Colors
  vintageDark: '#0f172a',
  vintageCream: '#faf8f3',
  vintageGold: '#d4af37',
  linkedinBlue: '#0077b5',
  
  // Slate Scale
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  }
} as const

export const typography = {
  fontFamily: {
    heading: 'var(--font-playfair), Playfair Display, serif',
    body: 'var(--font-inter), Inter, sans-serif',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
    '7xl': ['4.5rem', { lineHeight: '1' }],
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  }
} as const

export const spacing = {
  container: {
    maxWidth: '1024px', // max-w-4xl
    padding: '1.5rem', // px-6
  },
  section: {
    desktop: '4rem', // py-16
    mobile: '3rem', // py-12
  },
  gap: {
    sm: '1rem',
    md: '2rem',
    lg: '3rem',
    xl: '4rem',
  }
} as const

export const borderRadius = {
  sm: 'calc(0.625rem - 4px)',
  md: 'calc(0.625rem - 2px)',
  lg: '0.625rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const

export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const

export const animations = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  }
} as const

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Component-specific tokens
export const components = {
  button: {
    height: {
      sm: '2rem',
      default: '2.5rem',
      lg: '3rem',
      xl: '3.5rem',
    },
    padding: {
      sm: '0.75rem',
      default: '1rem',
      lg: '2rem',
      xl: '2.5rem',
    }
  },
  card: {
    padding: '1.5rem',
    borderWidth: '1px',
    borderRadius: borderRadius.lg,
  },
  input: {
    height: '2.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: borderRadius.md,
  }
} as const

