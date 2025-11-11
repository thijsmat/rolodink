'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type CallbackState = {
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
};

function extractParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.substring(1)
    : '';
  const search = window.location.search;

  if (hash) {
    return new URLSearchParams(hash);
  }

  return new URLSearchParams(search);
}

export function AuthCallbackClient() {
  const router = useRouter();
  const [state, setState] = useState<CallbackState>({
    status: 'pending',
    message: 'Processing your confirmation…',
  });

  const params = useMemo(() => extractParams(), []);

  useEffect(() => {
    const errorDescription =
      params.get('error_description') ?? params.get('error');

    if (errorDescription) {
      setState({
        status: 'error',
        message: "We couldn't verify your email.",
        details: errorDescription,
      });

      const timeout = setTimeout(() => {
        router.replace('/help');
      }, 5000);

      return () => clearTimeout(timeout);
    }

    const redirect = setTimeout(() => {
      router.replace('/download?signup=confirmed');
    }, 2500);

    setState({
      status: 'success',
      message: 'Your email is confirmed! Redirecting you to Rolodink…',
    });

    return () => clearTimeout(redirect);
  }, [params, router]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-azure/10 text-2xl">
        {state.status === 'error' ? '⚠️' : '✅'}
      </div>
      <div className="space-y-3">
        <h1 className="font-playfair text-3xl font-semibold text-azure">
          {state.status === 'error'
            ? 'Confirmation issue'
            : 'Email confirmed'}
        </h1>
        <p className="text-base text-grey">{state.message}</p>
        {state.details ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {state.details}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            You can close this tab if you are not redirected automatically.
          </p>
        )}
      </div>
    </div>
  );
}

