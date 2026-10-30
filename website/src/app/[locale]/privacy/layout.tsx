import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return pageMetadata(params, 'privacy')
}

// The page itself is a client component, so its metadata lives in this segment layout.
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
