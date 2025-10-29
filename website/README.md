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
NEXT_PUBLIC_EXTENSION_URL=https://chrome.google.com/webstore/detail/rolodink/...

# Site URL for sitemap generation
SITE_URL=https://rolodink.app
```

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
