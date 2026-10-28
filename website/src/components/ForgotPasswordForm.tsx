'use client'

import { supabase } from '@/lib/supabase'
import { useLocale } from 'next-intl'
import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

// Shown whether or not the address has an account: a different answer per
// address would tell anyone which addresses are registered.
const SENT_MESSAGE =
  'If an account exists for this address, we have sent a link to reset your password. Check your inbox and spam folder.'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const locale = useLocale()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Same construction as the signup callback: the callback sits outside
    // [locale], so the locale goes along, and type=recovery tells it to land
    // on the reset page instead of onboarding.
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('type', 'recovery')
    callbackUrl.searchParams.set('locale', locale)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl.toString(),
    })

    // Only a rate limit is worth showing; anything else would again reveal
    // whether the address exists.
    if (resetError && resetError.status === 429) {
      setError('Too many requests. Please wait a few minutes and try again.')
    } else {
      setSent(true)
    }
    setIsSubmitting(false)
  }

  if (sent) {
    return <p className="text-sm text-green-600">{SENT_MESSAGE}</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="you@example.com"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait…' : 'Send reset link'}
      </Button>
    </form>
  )
}
