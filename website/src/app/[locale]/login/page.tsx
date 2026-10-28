import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthLayout } from '@/components/auth-layout'
import { extractOAuthError } from '@/lib/utils'

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Auth.login' })
  return { title: t('metaTitle'), description: t('metaDescription') }
}

export const dynamic = 'force-dynamic'

type LoginPageProps = {
  searchParams: Promise<{
    oauth_error?: string | string[]
    next?: string
  }>
}

export default async function LoginPage(props: Readonly<LoginPageProps>) {
  const searchParams = await props.searchParams
  const oauthError = extractOAuthError(searchParams?.oauth_error)
  const next = searchParams?.next
  const t = await getTranslations('Auth.login')

  return (
    <AuthLayout
      mode="login"
      title={t('title')}
      subtitle={t('subtitle')}
      oauthError={oauthError}
      alternateLink={{
        text: t('newHere'),
        linkText: t('createAccount'),
        href: `/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`,
      }}
      next={next}
    />
  )
}
