import { describe, it, expect } from 'vitest';
import {
  isExtensionOrigin,
  isAllowedWebOrigin,
  isOriginAllowed,
  getAllowedOrigin,
  buildCorsHeaders,
} from './cors';

/**
 * These tests guard the one place where a mistake silently exposes the API to
 * every website on the internet. NODE_ENV is 'test' here, so the localhost
 * development origins are deliberately absent - production behaviour is what is
 * under test.
 */

function requestWithOrigin(origin?: string): Request {
  return new Request('https://api.rolodink.app/api/connections', {
    headers: origin ? { Origin: origin } : {},
  });
}

describe('isExtensionOrigin', () => {
  it('accepts chrome and moz extension origins', () => {
    expect(isExtensionOrigin('chrome-extension://jfgnbkeagmpmappmekainclghhndlimc')).toBe(true);
    // Firefox generates a fresh UUID per installation, which is exactly why
    // this check is scheme-based rather than an ID allowlist.
    expect(isExtensionOrigin('moz-extension://2f1a4e8c-0000-4c1a-9a3b-abcdef012345')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isExtensionOrigin('https://app.rolodink.app')).toBe(false);
    expect(isExtensionOrigin('https://evil.com')).toBe(false);
    expect(isExtensionOrigin(null)).toBe(false);
    expect(isExtensionOrigin(undefined)).toBe(false);
    expect(isExtensionOrigin('')).toBe(false);
  });

  it('is not fooled by a scheme appearing later in the string', () => {
    expect(isExtensionOrigin('https://evil.com/chrome-extension://abc')).toBe(false);
    expect(isExtensionOrigin('https://chrome-extension://evil.com')).toBe(false);
  });
});

describe('isAllowedWebOrigin', () => {
  it('accepts the web app', () => {
    expect(isAllowedWebOrigin('https://app.rolodink.app')).toBe(true);
  });

  it('rejects look-alikes and near misses', () => {
    // Exact match only: each of these differs from the allowlisted origin in a
    // way an attacker could control.
    expect(isAllowedWebOrigin('https://app.rolodink.app.evil.com')).toBe(false);
    expect(isAllowedWebOrigin('https://evil.com/app.rolodink.app')).toBe(false);
    expect(isAllowedWebOrigin('http://app.rolodink.app')).toBe(false); // plain http
    expect(isAllowedWebOrigin('https://app.rolodink.app:8443')).toBe(false); // other port
    expect(isAllowedWebOrigin('https://APP.ROLODINK.APP')).toBe(false); // browsers send lowercase
    expect(isAllowedWebOrigin('https://rolodink.app')).toBe(false); // marketing site, not the app
  });

  it('rejects the empty and missing cases', () => {
    expect(isAllowedWebOrigin(null)).toBe(false);
    expect(isAllowedWebOrigin(undefined)).toBe(false);
    expect(isAllowedWebOrigin('')).toBe(false);
  });

  it('does not include localhost outside development', () => {
    expect(isAllowedWebOrigin('http://localhost:3002')).toBe(false);
  });
});

describe('getAllowedOrigin', () => {
  it('echoes back an allowed origin exactly', () => {
    expect(getAllowedOrigin(requestWithOrigin('https://app.rolodink.app')))
      .toBe('https://app.rolodink.app');
  });

  it('returns null for a disallowed origin', () => {
    expect(getAllowedOrigin(requestWithOrigin('https://evil.com'))).toBeNull();
  });

  it('returns null when there is no Origin header', () => {
    // A native app or curl sends no Origin and needs no CORS headers.
    expect(getAllowedOrigin(requestWithOrigin())).toBeNull();
  });
});

describe('buildCorsHeaders', () => {
  it('sets the origin header for an allowed origin', () => {
    const headers = buildCorsHeaders(requestWithOrigin('https://app.rolodink.app'));
    expect(headers['Access-Control-Allow-Origin']).toBe('https://app.rolodink.app');
  });

  it('omits the origin header entirely for a disallowed origin', () => {
    // Omission is what makes the browser block the response; an empty string or
    // a wildcard would not.
    const headers = buildCorsHeaders(requestWithOrigin('https://evil.com'));
    expect(headers).not.toHaveProperty('Access-Control-Allow-Origin');
  });

  it('never emits a wildcard, for any input', () => {
    for (const origin of [
      'https://app.rolodink.app',
      'https://evil.com',
      'chrome-extension://abc',
      '*',
      'null',
      undefined,
    ]) {
      const headers = buildCorsHeaders(requestWithOrigin(origin));
      expect(headers['Access-Control-Allow-Origin']).not.toBe('*');
    }
  });

  it('always varies on Origin so caches cannot cross-serve responses', () => {
    expect(buildCorsHeaders(requestWithOrigin('https://app.rolodink.app')).Vary).toBe('Origin');
    expect(buildCorsHeaders(requestWithOrigin('https://evil.com')).Vary).toBe('Origin');
  });

  it('never allows credentials, since auth is bearer-token only', () => {
    expect(buildCorsHeaders(requestWithOrigin('https://app.rolodink.app'))['Access-Control-Allow-Credentials'])
      .toBe('false');
  });

  it('advertises the Authorization header, which every client needs', () => {
    expect(buildCorsHeaders(requestWithOrigin('https://app.rolodink.app'))['Access-Control-Allow-Headers'])
      .toContain('Authorization');
  });
});

describe('isOriginAllowed', () => {
  it('is the union of the extension and web checks', () => {
    expect(isOriginAllowed('chrome-extension://abc')).toBe(true);
    expect(isOriginAllowed('https://app.rolodink.app')).toBe(true);
    expect(isOriginAllowed('https://evil.com')).toBe(false);
    expect(isOriginAllowed(null)).toBe(false);
  });
});
