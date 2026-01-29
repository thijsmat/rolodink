import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const DEFAULT_ERROR_MESSAGE = 'LinkedIn sign in failed. Please try again.'
const VERIFY_TYPES = ['email', 'recovery', 'invite', 'email_change'] as const
type VerifyOtpType = (typeof VERIFY_TYPES)[number]
const VERIFY_TYPE_SET = new Set<VerifyOtpType>(VERIFY_TYPES)
const LEGACY_VERIFY_TYPE_MAP: Record<'signup' | 'magiclink', VerifyOtpType> = {
  signup: 'email',
  magiclink: 'email',
}

const isVerifyOtpType = (value: string | null): value is VerifyOtpType =>
  Boolean(value && VERIFY_TYPE_SET.has(value as VerifyOtpType))

export async function GET(request: Request) {
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
    if (legacyType) {
      return LEGACY_VERIFY_TYPE_MAP[legacyType]
    }
    return null
  })()

  const redirectWithError = (message: string = DEFAULT_ERROR_MESSAGE) => {
    const destination = new URL(intent === 'signup' ? '/signup' : '/login', requestUrl.origin)
    destination.searchParams.set('oauth_error', message)
    return NextResponse.redirect(destination)
  }

  if (error) {
    return redirectWithError(errorDescription ?? DEFAULT_ERROR_MESSAGE)
  }

  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({
    cookies: () => Promise.resolve(cookieStore),
  })

  if (tokenHash && otpType) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    })

    if (verifyError) {
      console.error('Supabase email confirmation failed', verifyError)
      return redirectWithError('Email confirmation failed. Please try again.')
    }

    const successPath = intent === 'signup' ? '/download?signup=confirmed' : '/download'
    return NextResponse.redirect(new URL(successPath, requestUrl.origin))
  }

  if (!code) {
    return redirectWithError()
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('LinkedIn OAuth exchange failed', exchangeError)
    return redirectWithError()
  }

  const successPath = intent === 'signup' ? '/download?signup=confirmed' : '/download'
  return NextResponse.redirect(new URL(successPath, requestUrl.origin))
}

