import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSafeRedirect } from '@/lib/utils'
import { routing } from '@/navigation'

const DEFAULT_ERROR_MESSAGE = 'Bevestiging mislukt. Probeer het opnieuw.'
const VERIFY_TYPES = ['email', 'recovery', 'invite', 'email_change'] as const
type VerifyOtpType = (typeof VERIFY_TYPES)[number]
const VERIFY_TYPE_SET = new Set<VerifyOtpType>(VERIFY_TYPES)
const LEGACY_VERIFY_TYPE_MAP: Record<'signup' | 'magiclink', VerifyOtpType> = {
  signup: 'email',
  magiclink: 'email',
}

const isVerifyOtpType = (value: string | null): value is VerifyOtpType =>
  Boolean(value && VERIFY_TYPE_SET.has(value as VerifyOtpType))

type Locale = (typeof routing.locales)[number]

const isLocale = (value: string | null | undefined): value is Locale =>
  Boolean(value && (routing.locales as readonly string[]).includes(value))

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const intent = requestUrl.searchParams.get('intent') === 'signup' ? 'signup' : 'login'
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const typeParam = requestUrl.searchParams.get('type')
  const legacyType =
    typeParam === 'signup' || typeParam === 'magiclink' ? typeParam : null

  const otpType = (() => {
    if (isVerifyOtpType(typeParam)) return typeParam
    if (legacyType) return LEGACY_VERIFY_TYPE_MAP[legacyType]
    return null
  })()

  const next = requestUrl.searchParams.get('next')

  // Deze route zit buiten het [locale]-segment, dus next-intl kan de taal hier
  // niet afleiden. De client die de callback-URL bouwt weet hem wel en geeft
  // hem mee; de cookie vangt oudere e-mailkoppelingen op die nog zonder
  // parameter binnenkomen. Whitelisten is verplicht - de waarde komt uit de
  // URL en gaat een redirectpad in.
  const cookieStore = await cookies()
  const localeParam = requestUrl.searchParams.get('locale')
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value
  const locale: Locale = isLocale(localeParam)
    ? localeParam
    : isLocale(localeCookie)
      ? localeCookie
      : routing.defaultLocale

  const redirectWithError = (message: string = DEFAULT_ERROR_MESSAGE) => {
    const destination = new URL(
      `/${locale}/${intent === 'signup' ? 'signup' : 'login'}`,
      requestUrl.origin
    )
    // De login- en signup-pagina lezen oauth_error; op 'error' keek niemand,
    // dus elke melding hieronder verdween tot nu toe geruisloos.
    destination.searchParams.set('oauth_error', message)
    if (next) destination.searchParams.set('next', next)
    return NextResponse.redirect(destination)
  }

  if (error) {
    return redirectWithError(errorDescription ?? DEFAULT_ERROR_MESSAGE)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )

  // Handle email confirmation (signup flow with token_hash + type)
  if (tokenHash && otpType) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    })

    if (verifyError) {
      console.error('Supabase email confirmation failed:', verifyError)
      return redirectWithError('E-mailbevestiging mislukt. Probeer het opnieuw.')
    }
  } else if (code) {
    // Handle OAuth / email signup code exchange
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange failed:', exchangeError)
      return redirectWithError()
    }
  } else {
    return redirectWithError()
  }

  // Redirect to success page after successful auth
  const defaultSuccessPath = `/${locale}/onboarding/success`
  const successPath = getSafeRedirect(next, defaultSuccessPath)

  return NextResponse.redirect(new URL(successPath, requestUrl.origin))
}
