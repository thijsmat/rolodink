import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthCard } from '@/components/auth-card'
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm'
import { extractOAuthError } from '@/lib/utils'

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Auth.forgot' })
  return { title: t('metaTitle'), description: t('metaDescription'), robots: { index: false } }
}

export const dynamic = 'force-dynamic'

type ForgotPasswordPageProps = {
  searchParams: Promise<{ oauth_error?: string | string[] }>
}

export default async function ForgotPasswordPage(props: Readonly<ForgotPasswordPageProps>) {
  const searchParams = await props.searchParams
  const t = await getTranslations('Auth.forgot')

  return (
    <AuthCard
      title={t('title')}
      subtitle={t('subtitle')}
      notice={extractOAuthError(searchParams?.oauth_error)}
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
