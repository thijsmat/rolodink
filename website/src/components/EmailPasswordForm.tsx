'use client'

import { supabase } from '@/lib/supabase'
import { useLocale, useTranslations } from 'next-intl'
import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Link } from '@/navigation'
import { getSafeRedirect } from '@/lib/utils'
import { authErrorKey } from '@/lib/auth-error-key'
import { isPwnedPassword } from '@rolodink/core/pwned-password'
import { MIN_PASSWORD_LENGTH } from '@rolodink/core/password'

type EmailPasswordFormProps = {
  mode: 'login' | 'signup'
  next?: string
}

// Zonder taalprefix bestaan deze paden niet: next-intl staat op localePrefix
// 'always' en de middleware matcht alleen / en /(nl|en)/:path*, dus /download
// haalt de [locale]-route nooit en geeft een 404.
const SUCCESS_PATHS: Record<EmailPasswordFormProps['mode'], string> = {
  login: '/download',
  signup: '/download?signup=confirmed',
}

type MessageState = {
  type: 'error' | 'success'
  text: string
}

export function EmailPasswordForm({ mode, next }: EmailPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<MessageState | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receivesUpdates, setReceivesUpdates] = useState(false)
  const locale = useLocale()
  const t = useTranslations('Auth')

  const showError = (text: string) => setMessage({ type: 'error', text })
  const showAuthError = (error: Parameters<typeof authErrorKey>[0]) =>
    showError(t(`errors.${authErrorKey(error)}`, { min: MIN_PASSWORD_LENGTH }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          showAuthError(error)
          return
        }
        window.location.href = getSafeRedirect(next, `/${locale}${SUCCESS_PATHS.login}`)
        return
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        showError(t('errors.passwordTooShort', { min: MIN_PASSWORD_LENGTH }))
        return
      }

      // Supabase's eigen lekcontrole zit alleen in een betaald plan, dus de
      // check draait hier: alleen een hashprefix gaat naar Have I Been Pwned,
      // en als die API onbereikbaar is gaat de aanmelding gewoon door.
      if (await isPwnedPassword(password)) {
        showError(t('errors.pwned'))
        return
      }

      // Zelfde opbouw als LinkedInSignInButton: searchParams doet de encoding,
      // en de locale moet mee omdat de callback buiten [locale] valt.
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('intent', 'signup')
      callbackUrl.searchParams.set('locale', locale)
      if (next) callbackUrl.searchParams.set('next', next)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl.toString(),
          data: {
            receives_updates: receivesUpdates,
          },
        },
      })

      if (error) {
        showAuthError(error)
        return
      }

      if (data.session) {
        window.location.href = getSafeRedirect(next, `/${locale}${SUCCESS_PATHS.signup}`)
      } else {
        setMessage({ type: 'success', text: t('signup.checkEmail') })
      }
    } catch {
      showError(t('errors.generic'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="space-y-2">
        <Label htmlFor={`${mode}-email`}>{t('common.email')}</Label>
        <Input
          id={`${mode}-email`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder={t('common.emailPlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={`${mode}-password`}>{t('common.password')}</Label>
          {mode === 'login' && (
            <Link
              href="/forgot-password"
              className="text-xs text-primary underline underline-offset-4"
            >
              {t('login.forgotPassword')}
            </Link>
          )}
        </div>
        <Input
          id={`${mode}-password`}
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          minLength={mode === 'signup' ? MIN_PASSWORD_LENGTH : undefined}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          placeholder="••••••••"
        />
      </div>

      {message ? (
        <p
          className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}
        >
          {message.text}
        </p>
      ) : null}

      {mode === 'signup' && (
        <div className="flex items-start gap-3 py-1">
          <input
            id="receives-updates"
            type="checkbox"
            checked={receivesUpdates}
            onChange={(e) => setReceivesUpdates(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-azure accent-azure cursor-pointer"
            disabled={isSubmitting}
          />
          <label htmlFor="receives-updates" className="text-sm text-muted-foreground leading-snug cursor-pointer">
            {t('signup.receivesUpdates')}
          </label>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('common.pleaseWait') : t(`${mode}.submit`)}
      </Button>
    </form>
  )
}
