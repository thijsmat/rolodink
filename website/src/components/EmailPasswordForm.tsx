'use client'

import { FormEvent, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type EmailPasswordFormProps = {
  mode: 'login' | 'signup'
}

const ENDPOINTS: Record<EmailPasswordFormProps['mode'], string> = {
  login: '/api/auth/signin',
  signup: '/api/auth/signup',
}

const SUCCESS_REDIRECTS: Record<EmailPasswordFormProps['mode'], string> = {
  login: '/download',
  signup: '/download?signup=confirmed',
}

export function EmailPasswordForm({ mode }: EmailPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch(ENDPOINTS[mode], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Something went wrong. Please try again.')
      }

      window.location.href = SUCCESS_REDIRECTS[mode]
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to process your request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="space-y-2">
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input
          id={`${mode}-email`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <Input
          id={`${mode}-password`}
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          placeholder="••••••••"
        />
      </div>

      {message ? (
        <p className="text-sm text-red-600">{message}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
      </Button>
    </form>
  )
}

