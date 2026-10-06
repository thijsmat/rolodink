import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/rate-limit', () => ({ rateLimitMiddleware: () => null }));
vi.mock('@/lib/version', () => ({ LATEST_EXTENSION_VERSION: '1.3.8' }));

import { GET } from './route';

const check = async (version: string) => {
  const res = await GET(new NextRequest(`https://api.rolodink.app/api/version?version=${version}`));
  return { status: res.status, body: await res.json() };
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/version', () => {
  it('points an outdated extension at the download page, not a GitHub zip', async () => {
    const { status, body } = await check('1.3.7');
    expect(status).toBe(200);
    expect(body.updateAvailable).toBe(true);
    expect(body.updateType).toBe('patch');
    expect(body.downloadUrl).toBe('https://rolodink.app/download');
  });

  it('says the browser updates by itself, and lists no stale fixes', async () => {
    const { body } = await check('1.3.7');
    expect(body.releaseNotes).toBe(
      'Bugfixes en verbeteringen in versie 1.3.8. Je browser installeert de update meestal vanzelf binnen een paar dagen.'
    );
    expect(body.features).toEqual([]);
    expect(body.bugFixes).toEqual([]);
  });

  it('keeps a configured download URL on an allowed host', async () => {
    vi.stubEnv('EXTENSION_DOWNLOAD_URL', 'https://github.com/thijsmat/rolodink/releases/latest');
    const { body } = await check('1.2.0');
    expect(body.downloadUrl).toBe('https://github.com/thijsmat/rolodink/releases/latest');
  });

  it('falls back to the download page for a configured URL on another host', async () => {
    vi.stubEnv('EXTENSION_DOWNLOAD_URL', 'https://evil.example/rolodink.zip');
    const { body } = await check('1.2.0');
    expect(body.downloadUrl).toBe('https://rolodink.app/download');
  });

  it('reports no update for the latest version', async () => {
    const { body } = await check('1.3.8');
    expect(body.updateAvailable).toBe(false);
    expect(body.downloadUrl).toBe('');
  });
});
