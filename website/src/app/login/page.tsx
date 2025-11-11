import type { Metadata } from 'next'
import Link from 'next/link'
import LinkedInSignInButton from '@/components/LinkedInSignInButton'
import { Separator } from '@/components/ui/separator'
import { EmailPasswordForm } from '@/components/EmailPasswordForm'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Sign in to Rolodink with LinkedIn or email credentials.',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-azure/10 bg-white/95 p-8 shadow-xl backdrop-blur">
        <div className="space-y-2 text-center">
          <h1 className="font-playfair text-3xl font-semibold text-azure">Sign in to Rolodink</h1>
          <p className="text-sm text-muted-foreground">
            Manage your LinkedIn notes securely with Rolodink.
          </p>
        </div>

        <LinkedInSignInButton />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide text-muted-foreground">
            <span className="bg-white px-2">Or continue with email</span>
          </div>
        </div>

        <EmailPasswordForm mode="login" />

        <p className="text-center text-sm text-muted-foreground">
          New to Rolodink?{' '}
          <Link href="/signup" className="text-primary underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}

