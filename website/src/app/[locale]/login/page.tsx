import type { Metadata } from 'next'
import { AuthLayout, extractOAuthError } from '@/components/auth-layout'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Sign in to Rolodink with LinkedIn or email credentials.',
}

export const dynamic = 'force-dynamic'

type LoginPageProps = {
  searchParams: Promise<{
    oauth_error?: string | string[]
  }>
}

export default async function LoginPage(props: Readonly<LoginPageProps>) {
  const searchParams = await props.searchParams
  const oauthError = extractOAuthError(searchParams?.oauth_error)

  return (
    <AuthLayout
      mode="login"
      title="Sign in to Rolodink"
      subtitle="Manage your LinkedIn notes securely with Rolodink."
      oauthError={oauthError}
      alternateLink={{
        text: 'New to Rolodink?',
        linkText: 'Create an account',
        href: '/signup',
      }}
    />
  )
}
