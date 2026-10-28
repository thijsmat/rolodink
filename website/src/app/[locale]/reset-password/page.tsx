import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthCard } from '@/components/auth-card'
import { ResetPasswordForm } from '@/components/ResetPasswordForm'
import { MIN_PASSWORD_LENGTH } from '@rolodink/core/password'

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Auth.reset' })
  return { title: t('metaTitle'), description: t('metaDescription'), robots: { index: false } }
}

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage() {
  const t = await getTranslations('Auth.reset')

  return (
    <AuthCard title={t('title')} subtitle={t('subtitle', { min: MIN_PASSWORD_LENGTH })}>
      <ResetPasswordForm />
    </AuthCard>
  )
}
