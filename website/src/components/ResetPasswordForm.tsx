'use client'

import { supabase } from '@/lib/supabase'
import { Link } from '@/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { isPwnedPassword } from '@rolodink/core/pwned-password'
import { MIN_PASSWORD_LENGTH } from '@rolodink/core/password'

type Status = 'checking' | 'no-session' | 'ready' | 'done'

type ResetPasswordFormProps = {
  /** 'invite': the user was invited and has no password yet. */
  mode?: 'reset' | 'invite'
}

/**
 * Sets a new password for the user that /auth/callback just signed in with
 * the recovery or invite link. Without that session there is nothing to
 * update, so the form is not shown at all.
 */
export function ResetPasswordForm({ mode = 'reset' }: Readonly<ResetPasswordFormProps>) {
  const isInvite = mode === 'invite'
  const submitLabel = isInvite ? 'Save password' : 'Save new password'
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setStatus(data.user ? 'ready' : 'no-session'))
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      }
      if (password !== confirmation) {
        throw new Error('The passwords do not match.')
      }
      // Same check as at signup (EmailPasswordForm): only a hash prefix leaves
      // the browser, and an unreachable API does not block the reset.
      if (await isPwnedPassword(password)) {
        throw new Error(
          'This password has appeared in a data breach. Please choose a different password.'
        )
      }

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      // Whoever had the old password stays signed in elsewhere otherwise. This
      // signs out every other session, the extension included; the user signs
      // in there again with the new password.
      await supabase.auth.signOut({ scope: 'others' })
      setStatus('done')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to change your password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'checking') {
    return <p className="text-center text-sm text-muted-foreground">Checking your link…</p>
  }

  if (status === 'no-session') {
    return (
      <p className="text-center text-sm text-muted-foreground">
        {isInvite
          ? 'This invitation has expired or was already used.'
          : 'This reset link has expired or was already used.'}{' '}
        <Link href="/forgot-password" className="text-primary underline underline-offset-4">
          Request a new link
        </Link>
        .
      </p>
    )
  }

  if (status === 'done') {
    return (
      <p className="text-sm text-green-600">
        {isInvite
          ? 'Your password has been set. Sign in to the Rolodink extension with your email address and this password.'
          : 'Your password has been changed. Sign in to the Rolodink extension with your new password.'}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="space-y-2">
        <Label htmlFor="reset-password">{isInvite ? 'Password' : 'New password'}</Label>
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
        <Label htmlFor="reset-password-confirmation">
          {isInvite ? 'Repeat password' : 'Repeat new password'}
        </Label>
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
        {isSubmitting ? 'Please wait…' : submitLabel}
      </Button>
    </form>
  )
}
