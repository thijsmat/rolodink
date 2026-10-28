import en from '@/messages/en.json'
import nl from '@/messages/nl.json'
import { routing } from '@/navigation'

const ERRORS = { en: en.Auth.errors, nl: nl.Auth.errors } as const

export type AuthErrorKey = keyof typeof en.Auth.errors

/**
 * An auth error text in the given locale, for code that runs outside the
 * [locale] segment (/auth/callback, the middleware) and so has no next-intl
 * request context. Falls back to the default locale for anything unknown.
 */
export function authError(locale: string | null | undefined, key: AuthErrorKey): string {
  const messages =
    locale === 'en' || locale === 'nl' ? ERRORS[locale] : ERRORS[routing.defaultLocale]
  return messages[key]
}
