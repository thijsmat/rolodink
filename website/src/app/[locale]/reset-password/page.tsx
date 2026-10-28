import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth-card'
import { ResetPasswordForm } from '@/components/ResetPasswordForm'
import { MIN_PASSWORD_LENGTH } from '@rolodink/core/password'

export const metadata: Metadata = {
  title: 'Choose a new password',
  description: 'Set a new password for your Rolodink account.',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

type ResetPasswordPageProps = {
  searchParams: Promise<{ mode?: string | string[] }>
}

export default async function ResetPasswordPage(props: Readonly<ResetPasswordPageProps>) {
  const searchParams = await props.searchParams
  // /auth/callback sets mode=invite for an invited user, who has no password
  // yet. The value only changes wording; the session decides what is allowed.
  const mode = searchParams?.mode === 'invite' ? 'invite' : 'reset'

  return (
    <AuthCard
      title={mode === 'invite' ? 'Choose a password' : 'Choose a new password'}
      subtitle={`Use at least ${MIN_PASSWORD_LENGTH} characters. You will use it to sign in to the extension.`}
    >
      <ResetPasswordForm mode={mode} />
    </AuthCard>
  )
}
