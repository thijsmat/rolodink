import type { Metadata } from 'next'
import Link from 'next/link'
import LinkedInSignInButton from '@/components/LinkedInSignInButton'
import { EmailPasswordForm } from '@/components/EmailPasswordForm'

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create your Rolodink account with LinkedIn or email.',
}

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-azure/10 bg-white/95 p-8 shadow-xl backdrop-blur">
        <div className="space-y-2 text-center">
          <h1 className="font-playfair text-3xl font-semibold text-azure">Join Rolodink</h1>
          <p className="text-sm text-muted-foreground">
            Sign up with LinkedIn or email to organise your LinkedIn relationships.
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

        <EmailPasswordForm mode="signup" />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}

