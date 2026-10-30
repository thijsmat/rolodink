// Renders og-image.html in this folder to the website's Open Graph / Twitter images,
// one 1200×630 PNG per locale: website/public/og-image-<locale>.png.
//
//   node marketing/og/render.mjs
//
// Uses Playwright from video/node_modules (run `npm ci` in video/ first), like the carousel.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, '../../video/package.json'));
const { chromium } = require('playwright');

const html = path.join(here, 'og-image.html');
const outDir = path.join(here, '../../website/public');

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(html).href);
await page.evaluate(() => document.fonts.ready);

for (const el of await page.$$('.og')) {
  const locale = await el.getAttribute('data-locale');
  const out = path.join(outDir, `og-image-${locale}.png`);
  await el.screenshot({ path: out });
  console.log(path.relative(process.cwd(), out));
}

await browser.close();
