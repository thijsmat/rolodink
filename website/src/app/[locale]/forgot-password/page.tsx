import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth-card'
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm'
import { extractOAuthError } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Request a link to reset your Rolodink password.',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

type ForgotPasswordPageProps = {
  searchParams: Promise<{ oauth_error?: string | string[] }>
}

export default async function ForgotPasswordPage(props: Readonly<ForgotPasswordPageProps>) {
  const searchParams = await props.searchParams

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email address and we will send you a link to choose a new one."
      notice={extractOAuthError(searchParams?.oauth_error)}
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
