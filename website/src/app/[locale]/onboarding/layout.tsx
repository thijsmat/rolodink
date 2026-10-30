import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Post-install pages are for new users only; the page is a client component, so the
// noindex lives in this segment layout and covers /onboarding/success as well.
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
