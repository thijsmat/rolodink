import type { Metadata } from 'next'
import { AuthLayout, extractOAuthError } from '@/components/auth-layout'

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create your Rolodink account with LinkedIn or email.',
}

export const dynamic = 'force-dynamic'

type SignupPageProps = {
  searchParams: Promise<{
    oauth_error?: string | string[]
  }>
}

export default async function SignupPage(props: Readonly<SignupPageProps>) {
  const searchParams = await props.searchParams
  const oauthError = extractOAuthError(searchParams?.oauth_error)

  return (
    <AuthLayout
      mode="signup"
      title="Join Rolodink"
      subtitle="Sign up with LinkedIn or email to organise your LinkedIn relationships."
      oauthError={oauthError}
      alternateLink={{
        text: 'Already have an account?',
        linkText: 'Sign in',
        href: '/login',
      }}
    />
  )
}
