'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FormEvent, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type EmailPasswordFormProps = {
  mode: 'login' | 'signup'
  next?: string
}

const SUCCESS_REDIRECTS: Record<EmailPasswordFormProps['mode'], string> = {
  login: '/download',
  signup: '/download?signup=confirmed',
}

type MessageState = {
  type: 'error' | 'success'
  text: string
}

export function EmailPasswordForm({ mode, next }: EmailPasswordFormProps) {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<MessageState | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          throw error
        }
        window.location.href = (next && next.startsWith('/') && !next.startsWith('//')) ? next : SUCCESS_REDIRECTS.login
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?intent=signup${next ? `&next=${encodeURIComponent(next)}` : ''}`,
        },
      })

      if (error) {
        throw error
      }

      if (data.session) {
        window.location.href = (next && next.startsWith('/') && !next.startsWith('//')) ? next : SUCCESS_REDIRECTS.signup
      } else {
        setMessage({
          type: 'success',
          text: 'Account created! Check your email to confirm your signup.',
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to process your request.',
      })
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
        <p
          className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}
        >
          {message.text}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
      </Button>
    </form>
  )
}

