import type { ErrorEvent } from '@sentry/nextjs';

/**
 * What leaves the backend for Sentry: the error, its stack trace and the
 * route. Nothing from the request itself.
 *
 * - headers: Authorization carries the user's access token; Cookie the
 *   session. Only a short allowlist of harmless headers stays.
 * - query string: `GET /api/connections?url=` is a LinkedIn profile URL,
 *   which identifies the person the note is about.
 * - body and cookies: connection payloads (ciphertext, but still the user's
 *   data) and session cookies.
 * - user and IP: Sentry would attach the client address; sendDefaultPii is
 *   off, and this removes anything that slipped through.
 *
 * Exported separately so it can be tested without initialising the SDK.
 */
const KEPT_HEADERS = new Set(['content-type', 'user-agent', 'origin']);

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const request = event.request;
  if (request) {
    delete request.data;
    delete request.cookies;
    delete request.query_string;
    if (request.url) request.url = request.url.split('?')[0];
    if (request.headers) {
      request.headers = Object.fromEntries(
        Object.entries(request.headers).filter(([name]) => KEPT_HEADERS.has(name.toLowerCase())),
      );
    }
  }
  delete event.user;
  if (event.breadcrumbs) {
    for (const crumb of event.breadcrumbs) {
      if (typeof crumb.data?.url === 'string') crumb.data.url = crumb.data.url.split('?')[0];
    }
  }
  return event;
}
