import * as Sentry from '@sentry/nextjs';
import { scrubEvent } from '@/lib/sentry-scrub';

// Without SENTRY_DSN (local dev, tests, preview deploys that lack it) the SDK
// is not started at all, so nothing is sent and nothing changes.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    // Collect nothing from the request or the process beyond the error and
    // its stack. Stack frame variables matter most: /api/user/key holds a
    // user's unwrapped data key in a local variable, and the default would
    // ship it with any error thrown there. scrubEvent (beforeSend) removes the
    // same fields again in case a default changes in a later SDK version.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: { allow: ['content-type', 'user-agent', 'origin'] }, response: false },
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      stackFrameVariables: false,
    },
    // Errors only. Tracing would add a span per request against the free
    // quota and tells us little the Vercel dashboard doesn't.
    tracesSampleRate: 0,
    integrations: [
      // The route handlers catch their errors and answer 500 with a
      // console.error; without this those never reach Sentry, because
      // onRequestError only sees errors that escape the handler.
      Sentry.captureConsoleIntegration({ levels: ['error'] }),
    ],
    beforeSend: scrubEvent,
  });
}
