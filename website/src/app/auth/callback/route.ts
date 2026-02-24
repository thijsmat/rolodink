import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSafeRedirect } from '@/lib/utils'

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

  const redirectWithError = (message: string = DEFAULT_ERROR_MESSAGE) => {
    const destination = new URL(intent === 'signup' ? '/nl/onboarding' : '/nl/onboarding', requestUrl.origin)
    destination.searchParams.set('error', message)
    if (next) destination.searchParams.set('next', next)
    return NextResponse.redirect(destination)
  }

  if (error) {
    return redirectWithError(errorDescription ?? DEFAULT_ERROR_MESSAGE)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
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
  const defaultSuccessPath = '/nl/onboarding/success'
  const successPath = getSafeRedirect(next, defaultSuccessPath)

  return NextResponse.redirect(new URL(successPath, requestUrl.origin))
}
