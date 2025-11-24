import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const DEFAULT_ERROR_MESSAGE = 'LinkedIn sign in failed. Please try again.'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const intent = requestUrl.searchParams.get('intent') === 'signup' ? 'signup' : 'login'

  const redirectWithError = (message: string = DEFAULT_ERROR_MESSAGE) => {
    const destination = new URL(intent === 'signup' ? '/signup' : '/login', requestUrl.origin)
    destination.searchParams.set('oauth_error', message)
    return NextResponse.redirect(destination)
  }

  if (error) {
    return redirectWithError(errorDescription ?? DEFAULT_ERROR_MESSAGE)
  }

  if (!code) {
    return redirectWithError()
  }

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore,
  })
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('LinkedIn OAuth exchange failed', exchangeError)
    return redirectWithError()
  }

  const successPath = intent === 'signup' ? '/download?signup=confirmed' : '/download'
  return NextResponse.redirect(new URL(successPath, requestUrl.origin))
}

