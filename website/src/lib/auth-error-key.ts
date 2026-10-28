import type { AuthErrorKey } from '@/lib/auth-messages'

/**
 * Maps a Supabase auth error to one of our translated messages. Supabase's own
 * `message` is English only, so it is never shown; anything not listed here
 * gets the generic text.
 */
export function authErrorKey(error: { code?: string; status?: number } | null | undefined): AuthErrorKey {
  switch (error?.code) {
    case 'invalid_credentials':
      return 'invalidCredentials'
    case 'email_not_confirmed':
      return 'emailNotConfirmed'
    case 'weak_password':
      return 'passwordTooShort'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'tooManyRequests'
  }
  return error?.status === 429 ? 'tooManyRequests' : 'generic'
}
