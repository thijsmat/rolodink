import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import robots from '../app/robots';

// next.config.js is CommonJS.
const nextConfig = createRequire(import.meta.url)('../../next.config.js') as {
  headers: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>>;
};

/**
 * api.rolodink.app is not a website. Google had crawled its template root page and
 * its assets as duplicates of rolodink.app; these tests keep it out of the index.
 */
describe('keeping the API host out of search engines', () => {
  it('robots.txt disallows everything for every crawler', () => {
    expect(robots().rules).toEqual({ userAgent: '*', disallow: '/' });
  });

  it('sends X-Robots-Tag noindex on every path', async () => {
    const rules = await nextConfig.headers();
    const everything = rules.find((rule) => rule.source === '/:path*');
    expect(everything?.headers).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
  });
});
