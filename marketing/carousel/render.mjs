// Renders a carousel HTML file in this folder to a PDF (one 1080×1350 page per slide)
// and, with --png, to one PNG per slide for checking.
//
//   node marketing/carousel/render.mjs vibecoding-lessen [--png <dir>]
//
// Uses Playwright and the fonts from video/node_modules (run `npm ci` in video/ first).
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, '../../video/package.json'));
const { chromium } = require('playwright');

const name = process.argv[2];
if (!name) {
  console.error('Usage: node render.mjs <name> [--png <dir>]');
  process.exit(1);
}
const pngIdx = process.argv.indexOf('--png');
const pngDir = pngIdx > -1 ? process.argv[pngIdx + 1] : null;

const html = path.join(here, `${name}.html`);
const pdf = path.join(here, `${name}.pdf`);

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
await page.goto(pathToFileURL(html).href);
await page.evaluate(() => document.fonts.ready);

await page.pdf({ path: pdf, width: '1080px', height: '1350px', printBackground: true, preferCSSPageSize: true });
console.log(`PDF: ${path.relative(process.cwd(), pdf)}`);

if (pngDir) {
  fs.mkdirSync(pngDir, { recursive: true });
  const slides = await page.$$('.slide');
  for (const [i, el] of slides.entries()) {
    const out = path.join(pngDir, `${name}-${String(i + 1).padStart(2, '0')}.png`);
    await el.screenshot({ path: out });
  }
  console.log(`${slides.length} PNG's in ${pngDir}`);
}

await browser.close();
