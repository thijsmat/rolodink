// Root layout that simply renders children
// The actual layout with providers is in [locale]/layout.tsx
export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
