// Rendert de store-afbeeldingen van Rolodink naar ./screenshots.
//
//   node render.mjs                  → alles: Chrome/Edge (nl, en), Firefox en de promotegels
//   node render.mjs --only nl,promo  → alleen die sets (nl, en, firefox, promo)
//   node render.mjs --shot 3         → alleen screenshot 3, in de gekozen sets
//   node render.mjs --skip-build     → de popup niet opnieuw bouwen
//   node render.mjs --preview        → lokale server; open de URL in je browser
//
// De popup in de screenshots is de echte popup uit linkedin-crm-extension/ui,
// gebouwd met demo-instellingen. Hij praat nergens echt mee: chrome.* is een
// stub (installChromeStub) en elke aanroep naar de API of Supabase beantwoordt
// dit script met de fictieve connecties uit copy/<taal>.json.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const ui = path.join(root, 'linkedin-crm-extension', 'ui');
const popupDir = path.join(here, '.popup');
const outDir = path.join(here, 'screenshots');

const DEMO = { api: 'https://api.rolodink.app', supabase: 'https://demo.supabase.co', version: '1.3.7' };

// Chrome Web Store en Edge Add-ons nemen per taal een eigen set; Firefox (AMO)
// neemt één set voor alle talen, dus daar staat geen tekst in beeld.
const SETS = {
  nl: { lang: 'nl', variant: 'store', dir: 'chrome-edge/nl' },
  en: { lang: 'en', variant: 'store', dir: 'chrome-edge/en' },
  firefox: { lang: 'en', variant: 'clean', dir: 'firefox' },
};
const TILES = [
  { variant: 'tile-small', width: 440, height: 280, file: 'promo/small-tile-440x280.png' },
  { variant: 'tile-marquee', width: 1400, height: 560, file: 'promo/marquee-1400x560.png' },
];

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const flag = name => args.includes(`--${name}`);

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const shots = readJson(path.join(here, 'shots.json'));
const copy = Object.fromEntries(['nl', 'en'].map(lang => [lang, readJson(path.join(here, 'copy', `${lang}.json`))]));
const messages = Object.fromEntries(['nl', 'en'].map(lang => [lang, readJson(path.join(ui, 'public', '_locales', lang, 'messages.json'))]));

// ---------- de popup bouwen ----------

async function buildPopup() {
  const require = createRequire(path.join(ui, 'package.json'));
  let viteDir;
  try {
    viteDir = path.dirname(require.resolve('vite/package.json'));
  } catch {
    throw new Error('Vite ontbreekt in linkedin-crm-extension/ui; installeer daar eerst met npm ci');
  }
  // Via process.env, net als release.yml: vite.config.ts leest ze met loadEnv.
  Object.assign(process.env, { VITE_SUPABASE_URL: DEMO.supabase, VITE_SUPABASE_ANON_KEY: 'demo', VITE_API_BASE_URL: DEMO.api });
  const { build } = await import(pathToFileURL(path.join(viteDir, 'dist', 'node', 'index.js')).href);
  await build({
    root: ui,
    configFile: path.join(ui, 'vite.config.ts'),
    logLevel: 'warn',
    build: { outDir: popupDir, emptyOutDir: true },
  });
}

// ---------- server ----------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(file);
    else yield file;
  }
}

// Alleen deze bestanden worden geserveerd. Het pad uit een verzoek is een
// sleutel in de lijst en wordt nooit zelf een bestandspad.
function servableFiles() {
  const files = new Map();
  const fromModules = file => path.join(here, 'node_modules', file);
  for (const name of ['index.html', 'style.css', 'main.js', 'shots.json']) files.set(`/${name}`, path.join(here, name));
  for (const lang of Object.keys(copy)) files.set(`/copy/${lang}.json`, path.join(here, 'copy', `${lang}.json`));
  files.set('/fonts/inter.woff2', fromModules('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'));
  files.set('/fonts/inter-tight-700.woff2', fromModules('@fontsource/inter-tight/files/inter-tight-latin-700-normal.woff2'));
  files.set('/fonts/inter-tight-800.woff2', fromModules('@fontsource/inter-tight/files/inter-tight-latin-800-normal.woff2'));
  files.set('/fonts/instrument-serif-italic.woff2', fromModules('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2'));
  files.set('/icons/icon48.png', path.join(ui, 'public', 'icons', 'icon48.png'));
  files.set('/afbeeldingen/rolodink.png', path.join(root, 'afbeeldingen', 'rolodink.png'));
  if (fs.existsSync(popupDir)) {
    for (const file of walk(popupDir)) files.set(`/popup/${path.relative(popupDir, file).split(path.sep).join('/')}`, file);
  }
  return files;
}

function serve() {
  const files = servableFiles();
  const server = http.createServer((req, res) => {
    const file = files.get(new URL(req.url, 'http://localhost').pathname);
    if (!file) {
      res.writeHead(404).end();
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(Number(opt('port', 0)), '127.0.0.1', () => resolve(server)));
}

// ---------- demodata en de chrome.*-stub ----------

// Een ingelogde sessie zoals supabase-js hem in chrome.storage.local bewaart. Het
// token is niet ondertekend; de popup controleert dat niet, en de API is hier nep.
function demoSession() {
  const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 3600;
  const user = { id: 'demo-user', aud: 'authenticated', role: 'authenticated', email: 'demo@rolodink.app', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
  const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, exp: expiresAt, aud: 'authenticated', role: 'authenticated' })}.demo`;
  return { access_token: token, token_type: 'bearer', expires_in: 365 * 24 * 3600, expires_at: expiresAt, refresh_token: 'demo', user };
}

// Draait in elke frame vóór de scripts van de pagina (Playwright addInitScript).
// Geeft de popup wat Chrome hem anders geeft: opslag met de sessie, het actieve
// tabblad, de vertalingen uit _locales en antwoorden van de service worker.
function installChromeStub({ messages, lang, session, storageKey, tabUrl, version }) {
  const store = { [storageKey]: JSON.stringify(session), lastUpdateCheck: Date.now() };
  const keysOf = keys => {
    if (keys == null) return Object.keys(store);
    if (typeof keys === 'string') return [keys];
    return Array.isArray(keys) ? keys : Object.keys(keys);
  };
  const local = {
    get: async keys => Object.fromEntries(keysOf(keys).filter(key => key in store).map(key => [key, store[key]])),
    set: async items => { Object.assign(store, items); },
    remove: async keys => { for (const key of keysOf(keys)) delete store[key]; },
  };
  const getMessage = (key, substitutions) => {
    const entry = messages[key];
    if (!entry) return '';
    let list = [];
    if (substitutions != null) list = Array.isArray(substitutions) ? substitutions : [substitutions];
    const fill = text => text.replaceAll(/\$(\d)/g, (_, n) => list[n - 1] ?? '');
    let text = entry.message;
    for (const [name, placeholder] of Object.entries(entry.placeholders ?? {})) {
      text = text.replaceAll(new RegExp(String.raw`\$${name}\$`, 'gi'), fill(placeholder.content));
    }
    return fill(text).replaceAll('$$', '$');
  };
  // de popup registreert luisteraars, maar er komen hier geen berichten
  const events = { addListener: () => undefined, removeListener: () => undefined };
  globalThis.chrome = {
    storage: { local, session: local, onChanged: events },
    tabs: { query: async () => [{ id: 1, active: true, url: tabUrl }] },
    runtime: {
      id: 'rolodink-demo',
      lastError: undefined,
      onMessage: events,
      getManifest: () => ({ name: 'Rolodink', version }),
      getURL: file => file,
      // De notities in de demodata zijn platte tekst; versleutelen hoort bij de
      // service worker en die draait hier niet.
      sendMessage: async message => {
        if (message?.type === 'DECRYPT_TEXT') return { success: true, plaintext: String(message.ciphertext).replace(/^rolodink-enc:/, '') };
        if (message?.type === 'ENCRYPT_TEXT') return { success: true, ciphertext: `rolodink-enc:${message.text}` };
        return { success: true };
      },
    },
    i18n: { getMessage, getUILanguage: () => lang },
    identity: { launchWebAuthFlow: async () => '', getRedirectURL: () => '' },
  };
}

function apiConnections(lang) {
  const { connections, myCompany } = copy[lang];
  return connections.map((c, i) => {
    // de nieuwste bovenaan, een dag uit elkaar
    const stamp = new Date(Date.UTC(2026, 8, 28 - i, 9, 30)).toISOString();
    return {
      id: c.id, name: c.name, linkedInUrl: `https://www.linkedin.com/in/${c.slug}`, ownerId: 'demo-user',
      notes: c.notes, meetingPlace: c.meetingPlace, userCompanyAtTheTime: myCompany,
      email: null, phone: null, createdAt: stamp, updatedAt: stamp,
    };
  });
}

async function newContext(browser, { width, height, lang = 'nl', tabSlug = 'sannevisser' }) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, locale: lang === 'nl' ? 'nl-NL' : 'en-US' });
  await context.addInitScript(installChromeStub, {
    messages: messages[lang],
    lang,
    session: demoSession(),
    storageKey: `sb-${new URL(DEMO.supabase).hostname.split('.')[0]}-auth-token`,
    tabUrl: `https://www.linkedin.com/in/${tabSlug}/`,
    version: DEMO.version,
  });
  const connections = apiConnections(lang);
  await context.route(`${DEMO.api}/**`, route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/version') return route.fulfill({ json: { updateAvailable: false, latest: DEMO.version, current: DEMO.version } });
    if (url.pathname === '/api/connections') {
      const lookup = url.searchParams.get('url');
      if (lookup == null) return route.fulfill({ json: connections });
      return route.fulfill({ json: connections.filter(c => lookup.includes(c.linkedInUrl.split('/in/')[1])) });
    }
    return route.fulfill({ status: 404, json: {} });
  });
  await context.route(`${DEMO.supabase}/**`, route => route.fulfill({ json: {} }));
  return context;
}

// ---------- de popup in de juiste stand zetten ----------

// Scrollt het inhoudsgebied van de popup zo dat `target` bovenaan staat. De kop
// van de popup blijft staan; alleen .contentArea scrolt.
async function scrollToTop(target) {
  await target.evaluate(node => {
    let box = node.parentElement;
    while (box && !(box.scrollHeight > box.clientHeight && getComputedStyle(box).overflowY === 'auto')) box = box.parentElement;
    if (box) box.scrollTop += node.getBoundingClientRect().top - box.getBoundingClientRect().top - 12;
  });
}

async function drivePopup(page, view, lang) {
  const popup = page.frameLocator('.popup iframe');
  const t = key => messages[lang][key].message;
  await popup.getByRole('heading', { name: t('appName'), exact: true }).waitFor();

  if (view === 'new') {
    const fields = popup.locator('form input');
    await fields.first().waitFor();
    await fields.nth(0).fill(copy[lang].newConnection.meetingPlace);
    await fields.nth(1).fill(copy[lang].myCompany);
    const notes = popup.locator('form textarea');
    await notes.fill(copy[lang].newConnection.notes);
    await notes.blur();
    // bovenaan laten staan: daar staat waar jullie elkaar ontmoetten
    await popup.locator('form').evaluate(form => form.closest('[class*="contentArea"]')?.scrollTo(0, 0));
  }
  if (view === 'settings') {
    await popup.getByRole('button', { name: t('settings_button') }).click();
    const section = popup.getByRole('heading', { name: t('security_encryption_title') });
    await section.waitFor();
    await scrollToTop(section);
  }
  if (view === 'list' || view === 'search') {
    await popup.getByRole('button', { name: t('show_all_connections_button') }).click();
    await popup.getByPlaceholder(t('search_placeholder')).waitFor();
  }
  if (view === 'search') {
    const search = popup.getByPlaceholder(t('search_placeholder'));
    await search.fill(copy[lang].search);
    await popup.locator('mark').first().waitFor();
    await search.blur();
  }
  // de muis weg van de knoppen, anders blijft de laatst geklikte plek in hover
  await page.mouse.move(4, 4);
  // de popup animeert zijn weergaven in; daarna staat hij stil
  await page.waitForTimeout(400);
}

// ---------- renderen en controleren ----------

// Elke store wil een PNG van precies deze maat, zonder alfakanaal.
function checkPng(file, width, height) {
  const data = fs.readFileSync(file);
  const w = data.readUInt32BE(16);
  const h = data.readUInt32BE(20);
  const colorType = data[25];
  if (w !== width || h !== height) throw new Error(`${file}: ${w}×${h}, verwacht ${width}×${height}`);
  if (colorType !== 2) throw new Error(`${file}: PNG-kleurtype ${colorType}, verwacht 2 (24-bit RGB zonder alfa)`);
  return data.length;
}

async function renderPage(browser, base, { width, height, query, lang, tabSlug, popupView, file }) {
  const context = await newContext(browser, { width, height, lang, tabSlug });
  try {
    const page = await context.newPage();
    page.on('pageerror', e => console.error(`Fout in ${file}:`, e.message));
    await page.goto(`${base}/index.html?${new URLSearchParams(query)}`);
    await page.waitForFunction(() => globalThis.__ready === true || globalThis.__error, null, { timeout: 30000 });
    const error = await page.evaluate(() => globalThis.__error);
    if (error) throw new Error(`${file}: ${error}`);
    if (popupView) await drivePopup(page, popupView, lang);
    const target = path.join(outDir, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    await page.screenshot({ path: target, type: 'png' });
    const bytes = checkPng(target, width, height);
    console.log(`${file.padEnd(42)} ${width}×${height}  ${(bytes / 1024).toFixed(0).padStart(4)} kB`);
  } finally {
    await context.close();
  }
}

const only = opt('only', 'nl,en,firefox,promo').split(',');
const shotFilter = opt('shot');
const selectedShots = shots.filter((s, i) => !shotFilter || s.id === shotFilter || String(i + 1) === shotFilter);

if (!flag('skip-build') || !fs.existsSync(popupDir)) {
  console.log('Popup bouwen met demo-instellingen…');
  await buildPopup();
}

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}`;

if (flag('preview')) {
  console.log(`Preview: ${base}/index.html?variant=store&lang=nl&shot=1-note-on-profile`);
  console.log('Let op: in een gewone browser ontbreken de stub en de demodata, dus de popup blijft leeg.');
} else {
  const jobs = only.filter(n => n in SETS).flatMap(name => {
    const set = SETS[name];
    return selectedShots.map(shot => ({
      width: 1280, height: 800, lang: set.lang,
      tabSlug: copy[set.lang].people[shot.profile].slug, popupView: shot.popup,
      query: { variant: set.variant, lang: set.lang, shot: shot.id },
      file: `${set.dir}/${shot.id}.png`,
    }));
  });
  if (only.includes('promo') && !shotFilter) {
    jobs.push(...TILES.map(tile => ({ width: tile.width, height: tile.height, query: { variant: tile.variant }, file: tile.file })));
  }
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--font-render-hinting=none'] });
  try {
    // Elke pagina krijgt een eigen context, dus ze renderen tegelijk.
    await Promise.all(jobs.map(job => renderPage(browser, base, job)));
  } finally {
    await browser.close();
    server.close();
  }
}
