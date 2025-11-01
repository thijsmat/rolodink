# Firefox Publishing with web-ext

## Prereqs
- Node.js 18+
- GitHub repo cloned
- AMO API credentials (JWT issuer and secret)

## Get AMO API credentials

To obtain your real credentials from Mozilla:

1. **Log in to AMO Developer Hub**
   - Go to: https://addons.mozilla.org/developers/
   - Sign in with your Mozilla/Firefox Account

2. **Navigate to API Keys**
   - Click on **"Tools"** in the top navigation
   - Select **"Manage API Keys"** from the dropdown

3. **Generate new API key**
   - Click **"Generate new API key"** button
   - You'll see two values:
     - **JWT Issuer** (e.g., `user:12345678:999`) → This is your `WEB_EXT_API_KEY`
     - **JWT Secret** (a long hex string) → This is your `WEB_EXT_API_SECRET`

4. **⚠️ Important**: The JWT Secret is **only shown once**! Copy it immediately and save it securely.

5. **Add to `.env` file**
   - Copy `.env.example` to `.env` (if not exists)
   - Replace the placeholder values with your real credentials

**Direct link to API keys**: https://addons.mozilla.org/developers/addon/api/key/

## Setup
1. Create `.env` at repo root using `.env.example`
2. Install deps:
   ```bash
   npm install
   ```

## Build and sign
- Build Firefox source and sign:
  ```bash
  npm run sign:firefox
  ```
- Artifacts will appear in `web-ext-artifacts/`

## Commands
- Build source only:
  ```bash
  npm run build:firefox
  ```
- Watch in Firefox Developer Edition:
  ```bash
  npm run watch:firefox
  ```

## Troubleshooting
- 401 Unauthorized: verify `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` in environment
- Missing ui/dist: run build of UI (`linkedin-crm-extension/ui: npm run build`)
- Manifest mismatch: ensure `manifest-firefox.json` → `manifest.json` swap occurs

## Clean builds (minimal artifact)
- The source preparation script creates a minimal `.web-ext-src/` with ONLY runtime files:
  - `manifest.json` (from `manifest-firefox.json`)
  - `content.js`
  - `icon.png`
  - `icons/`
  - `ui/dist/`
- Excludes docs, `dist/`, `node_modules/`, maps, TypeScript sources, etc. Resulting ZIP should be ~150KB.
- Build without signing for verification:
  ```bash
  npm run build:firefox
  npx web-ext build --source-dir .web-ext-src --artifacts-dir web-ext-artifacts --overwrite-dest
  ls -lh web-ext-artifacts
  ```

