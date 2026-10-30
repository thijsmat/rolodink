import type { MetadataRoute } from 'next';

// api.rolodink.app is not a website. Without a robots.txt Google crawled the
// root page and its static assets and listed them as duplicates of rolodink.app.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  };
}
