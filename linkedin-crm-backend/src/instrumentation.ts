import * as Sentry from '@sentry/nextjs';

export async function register() {
  // The route handlers and proxy.ts all run on the Node.js runtime; there is
  // no Edge code in this app, so there is no edge config either.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
}

// Errors that escape a route handler or proxy.ts.
export const onRequestError = Sentry.captureRequestError;
