# Rolodink Chrome Extension UI

Browser extension UI for adding personal notes to LinkedIn profiles.

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Vanilla CSS + CSS Modules (see [STYLING.md](STYLING.md))
- **Backend**: Supabase
- **Browser APIs**: Chrome Extension Manifest V3

## Development

```bash
# Install dependencies
npm install

# Run development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
ui/
├── src/
│   ├── components/       # React components
│   ├── styles/           # CSS custom properties
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main app component
│   ├── index.css         # Global styles
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── dist/                 # Production build output
```

## Styling

See [STYLING.md](STYLING.md) for:
- CSS architecture overview
- CSS Modules usage patterns
- Design tokens (colors, spacing, typography)
- Component styling examples
- Best practices

**Quick Summary:**
- Uses **Vanilla CSS + CSS Modules** (no Tailwind)
- LinkedIn-inspired design system
- Custom CSS properties for theming
- Small bundle size (~8KB CSS)

## Extension Architecture

The UI is embedded in LinkedIn pages via content scripts and communicates with:
- **Background Service Worker**: Handles API calls and state
- **Content Scripts**: Inject UI into LinkedIn DOM
- **Supabase Backend**: Store user notes and data

## Features

- ✅ Add notes to LinkedIn profiles
- ✅ View all connections with notes
- ✅ Search and filter connections
- ✅ Sync data via Supabase
- ✅ Offline support (local storage fallback)
- ✅ Privacy-first (encrypted notes)

## Build Output

The `dist/` folder contains:
- `index.html` - Extension popup
- `assets/` - Bundled JS and CSS
- Static assets from `public/`

This output is used by the extension's manifest to display the popup UI.

## Related Documentation

- [Main Project README](../../README.md)
- [Extension Root](../)
- [Styling Guide](STYLING.md)
- [Monorepo Styling Overview](../../STYLING.md)
