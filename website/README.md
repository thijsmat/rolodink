# Rolodink Website

Marketing website for the Rolodink LinkedIn CRM browser extension.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v3.4.1 + shadcn/ui (see [STYLING.md](STYLING.md))
- **Analytics**: Plausible
- **Deployment**: Vercel
- **Domain**: rolodink.app

## Pages

- `/` - Landing page with hero, features preview, and CTA
- `/features` - Detailed features overview
- `/how-it-works` - 3-step process explanation
- `/download` - Extension download with installation instructions
- `/over` - Articles about Rolodink (content from the CMS, see below)
- `/privacy` - Privacy policy
- `/terms` - Terms of service

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env.local` file:

```env
# Extension URL - update when published to Chrome Web Store
NEXT_PUBLIC_EXTENSION_URL=https://chromewebstore.google.com/detail/rolodink/jfgnbkeagmpmappmekainclghhndlimc

# Site URL for sitemap generation
SITE_URL=https://rolodink.app

# Content for /over (Cockpit CMS on cms.rolodink.app, see ../cms/README.md)
CMS_BASE_URL=https://cms.rolodink.app
CMS_API_KEY=...
CMS_REVALIDATE_SECRET=...
```

## Content (Over) via Cockpit

The articles under `/over` are managed in a headless [Cockpit CMS](https://github.com/Cockpit-HQ/Cockpit)
hosted separately (`cms.rolodink.app`). The website fetches published items server-side
(`src/lib/cms.ts`), sanitizes the HTML and renders them in the site's own design. Responses are
cached for 10 minutes (Next.js Data Cache, tag `cms`); the CMS calls `POST /api/revalidate`
with the `x-cms-secret` header after every change so updates show up immediately.

Setup of the CMS itself (model, API key, hook) is documented in [`../cms/README.md`](../cms/README.md).

## Deployment

The website is configured for Vercel deployment:

1. Connect the repository to Vercel
2. Set the domain to `rolodink.app`
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main

## SEO

- Automatic sitemap generation (`/sitemap.xml`)
- Robots.txt (`/robots.txt`)
- Open Graph meta tags
- Twitter Card support
- Plausible analytics integration

## Features

- ✅ Responsive design (mobile-first)
- ✅ Dark mode support
- ✅ Fast loading (static generation)
- ✅ SEO optimized
- ✅ Analytics ready
- ✅ Accessibility friendly

## Styling

See [STYLING.md](STYLING.md) for:
- Tailwind CSS configuration
- Custom color system
- Component styling patterns
- Responsive design guidelines
- Troubleshooting guide
