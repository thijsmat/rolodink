'use client'

import { supabase } from '@/lib/supabase'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import { FormEvent, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { authErrorKey } from '@/lib/auth-error-key'
import { isPwnedPassword } from '@rolodink/core/pwned-password'
import { MIN_PASSWORD_LENGTH } from '@rolodink/core/password'

type Status = 'checking' | 'no-session' | 'ready' | 'done'

/**
 * Sets a new password for the user that /auth/callback just signed in with
 * the recovery link. Without that session there is nothing to update, so the
 * form is not shown at all.
 */
export function ResetPasswordForm() {
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslations('Auth')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setStatus(data.user ? 'ready' : 'no-session'))
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(t('errors.passwordTooShort', { min: MIN_PASSWORD_LENGTH }))
        return
      }
      if (password !== confirmation) {
        setError(t('errors.mismatch'))
        return
      }
      // Same check as at signup (EmailPasswordForm): only a hash prefix leaves
      // the browser, and an unreachable API does not block the reset.
      if (await isPwnedPassword(password)) {
        setError(t('errors.pwned'))
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(t(`errors.${authErrorKey(updateError)}`, { min: MIN_PASSWORD_LENGTH }))
        return
      }

      // Whoever had the old password stays signed in elsewhere otherwise. This
      // signs out every other session, the extension included; the user signs
      // in there again with the new password.
      await supabase.auth.signOut({ scope: 'others' })
      setStatus('done')
    } catch {
      setError(t('errors.generic'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'checking') {
    return <p className="text-center text-sm text-muted-foreground">{t('reset.checking')}</p>
  }

  if (status === 'no-session') {
    return (
      <p className="text-center text-sm text-muted-foreground">
        {t.rich('reset.expired', {
          link: (chunks) => (
            <Link href="/forgot-password" className="text-primary underline underline-offset-4">
              {chunks}
            </Link>
          ),
        })}
      </p>
    )
  }

  if (status === 'done') {
    return <p className="text-sm text-green-600">{t('reset.done')}</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="space-y-2">
        <Label htmlFor="reset-password">{t('reset.newPassword')}</Label>
        <Input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          placeholder="••••••••"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-password-confirmation">{t('reset.repeatPassword')}</Label>
        <Input
          id="reset-password-confirmation"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          placeholder="••••••••"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('common.pleaseWait') : t('reset.submit')}
      </Button>
    </form>
  )
}
