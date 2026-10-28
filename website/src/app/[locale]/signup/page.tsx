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
  const t = await getTranslations({ locale, namespace: 'Auth.signup' })
  return { title: t('metaTitle'), description: t('metaDescription') }
}

export const dynamic = 'force-dynamic'

type SignupPageProps = {
  searchParams: Promise<{
    oauth_error?: string | string[]
    next?: string
  }>
}

export default async function SignupPage(props: Readonly<SignupPageProps>) {
  const searchParams = await props.searchParams
  const oauthError = extractOAuthError(searchParams?.oauth_error)
  const next = searchParams?.next
  const t = await getTranslations('Auth.signup')

  return (
    <AuthLayout
      mode="signup"
      title={t('title')}
      subtitle={t('subtitle')}
      oauthError={oauthError}
      alternateLink={{
        text: t('haveAccount'),
        linkText: t('signIn'),
        href: `/login${next ? `?next=${encodeURIComponent(next)}` : ''}`,
      }}
      next={next}
    />
  )
}
