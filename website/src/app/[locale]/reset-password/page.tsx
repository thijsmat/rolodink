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

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Choose a new password"
      subtitle={`Use at least ${MIN_PASSWORD_LENGTH} characters. You will use it to sign in to the extension.`}
    >
      <ResetPasswordForm />
    </AuthCard>
  )
}
