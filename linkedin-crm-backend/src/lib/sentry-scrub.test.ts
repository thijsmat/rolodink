import { describe, expect, it } from 'vitest';
import type { ErrorEvent } from '@sentry/nextjs';
import { scrubEvent } from './sentry-scrub';

const event = (): ErrorEvent => ({
  type: undefined,
  message: 'boom',
  request: {
    url: 'https://api.rolodink.app/api/connections?url=https%3A%2F%2Fwww.linkedin.com%2Fin%2Fjan',
    query_string: 'url=https%3A%2F%2Fwww.linkedin.com%2Fin%2Fjan',
    data: '{"notes":"rolodink-enc:abc"}',
    cookies: { 'sb-access-token': 'secret' },
    headers: {
      Authorization: 'Bearer eyJ.secret',
      Cookie: 'sb=secret',
      'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0',
      'x-forwarded-for': '203.0.113.7',
    },
  },
  user: { id: 'user-1', ip_address: '203.0.113.7' },
  breadcrumbs: [{ category: 'http', data: { url: 'https://api.rolodink.app/api/connections?url=x' } }],
});

describe('scrubEvent', () => {
  it('drops the token, cookies, body, query and client address', () => {
    const out = scrubEvent(event());
    expect(out.request?.headers).toEqual({ 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0' });
    expect(out.request?.data).toBeUndefined();
    expect(out.request?.cookies).toBeUndefined();
    expect(out.request?.query_string).toBeUndefined();
    expect(out.user).toBeUndefined();
  });

  it('keeps the route but not the LinkedIn URL in it', () => {
    const out = scrubEvent(event());
    expect(out.request?.url).toBe('https://api.rolodink.app/api/connections');
    expect(out.breadcrumbs?.[0].data?.url).toBe('https://api.rolodink.app/api/connections');
  });

  it('keeps the error itself', () => {
    expect(scrubEvent(event()).message).toBe('boom');
  });

  it('copes with an event without a request', () => {
    expect(scrubEvent({ type: undefined, message: 'x' }).message).toBe('x');
  });
});
