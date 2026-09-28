// Rendert de compositie in index.html frame voor frame naar MP4, met geluid.
//
//   node render.mjs                      → rolodink-uitleg.mp4 en -poster.jpg (1920×1080, 60 fps, AAC-stereo)
//   node render.mjs --lang en            → de Engelse versie: rolodink-explainer.mp4 en -poster.jpg
//   node render.mjs --audio-only         → alleen de soundtrack opnieuw; het beeld blijft staan
//   node render.mjs --still 3.4,7.5      → losse frames als PNG in ./stills
//   node render.mjs --from 5 --to 9      → alleen een stuk van de tijdlijn
//   node render.mjs --preview            → lokale server; open de URL in je browser
//
// Opties: --out <bestand> --fps <n> --crf <n> --outdir <map> --port <n>
//         --no-audio (zonder geluid) --wav <bestand> (de soundtrack ook als WAV bewaren)
// De teksten per taal staan in copy.js. Een eigen Chrome/Chromium gebruiken kan met
// CHROME_PATH=/pad/naar/chrome.

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';
import { soundtrack } from './soundtrack.mjs';
import { wav } from './synth.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
// De server staat op de root van de repo, zodat de compositie het app-icoon
// uit ../afbeeldingen kan laden zonder er een kopie van te maken.
const root = path.resolve(here, '..');

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const flag = name => args.includes(`--${name}`);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

// De server kent alleen de bestanden die de compositie nodig heeft. Het pad uit
// een verzoek is een sleutel in deze lijst en wordt nooit zelf een bestandspad.
function servableFiles() {
  const files = new Map();
  const add = file => files.set(`/${path.relative(root, file).split(path.sep).join('/')}`, file);
  for (const name of ['index.html', 'style.css', 'copy.js', 'main.js']) add(path.join(here, name));
  add(path.join(root, 'afbeeldingen', 'rolodink.png'));
  // de lettertypen die style.css met @font-face laadt
  const css = fs.readFileSync(path.join(here, 'style.css'), 'utf8');
  for (const [, font] of css.matchAll(/url\('(node_modules\/[^']+\.woff2)'\)/g)) add(path.join(here, font));
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

function ffmpeg(ffArgs, stdin = 'ignore') {
  const proc = spawn(ffmpegPath, ['-y', '-loglevel', 'error', ...ffArgs], { stdio: [stdin, 'inherit', 'inherit'] });
  const done = new Promise((resolve, reject) => {
    proc.on('error', reject);
    proc.on('close', code => (code === 0 ? resolve() : reject(new Error(`ffmpeg stopte met code ${code}`))));
  });
  return { proc, done };
}

// Maakt de soundtrack bij de cues uit main.js en zet hem onder de video. Het beeld
// wordt gekopieerd, niet opnieuw gecodeerd.
async function addSoundtrack(page, timeline, video, from, to) {
  const cues = await page.evaluate(() => window.soundCues());
  const { audio, lufs, limiting } = soundtrack({ ...timeline, cues });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rolodink-'));
  try {
    const wavFile = path.join(dir, 'soundtrack.wav');
    fs.writeFileSync(wavFile, wav(audio));
    if (opt('wav')) fs.copyFileSync(wavFile, path.resolve(here, opt('wav')));
    const muxed = path.join(dir, 'video.mp4');
    await ffmpeg([
      '-i', video,
      '-ss', String(from), '-t', String(to - from), '-i', wavFile,
      '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
      '-movflags', '+faststart', muxed,
    ]).done;
    fs.copyFileSync(muxed, video);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(`soundtrack: ${lufs.toFixed(1)} LUFS, limiter maximaal ${limiting.toFixed(1)} dB`);
}

const server = await serve();
const url = `http://127.0.0.1:${server.address().port}/video/index.html`;

const lang = opt('lang', 'nl');

if (flag('preview')) {
  console.log(`Preview: ${url}  (spatie = afspelen/pauzeren, pijltjes = frame voor frame)`);
  console.log(`Engels:  ${url}?lang=en`);
} else {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--font-render-hinting=none', '--disable-lcd-text'],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('Fout in de compositie:', e.message));
  page.on('console', m => m.type() === 'error' && console.error('Console:', m.text()));
  await page.goto(`${url}?render&lang=${encodeURIComponent(lang)}`);
  await page.evaluate(() => window.__ready);
  const timeline = await page.evaluate(() => window.__timeline);
  if (timeline.lang !== lang) throw new Error(`Onbekende taal "${lang}"; de talen staan in copy.js`);
  const fps = Number(opt('fps', timeline.fps));
  const frame = t => page.evaluate(x => window.renderFrame(x), t);

  if (opt('still')) {
    const outdir = path.resolve(here, opt('outdir', 'stills'));
    fs.mkdirSync(outdir, { recursive: true });
    for (const s of opt('still').split(',')) {
      const t = Number(s);
      await frame(t);
      const file = path.join(outdir, `t${t.toFixed(2).padStart(5, '0')}.png`);
      await page.screenshot({ path: file });
      console.log(file);
    }
  } else if (flag('audio-only')) {
    const out = path.resolve(here, opt('out', `${timeline.file}.mp4`));
    if (!fs.existsSync(out)) throw new Error(`${out} bestaat nog niet; render eerst het beeld met npm run render`);
    await addSoundtrack(page, timeline, out, 0, timeline.duration);
    console.log(out);
  } else {
    const from = Number(opt('from', 0));
    const to = Math.min(Number(opt('to', timeline.duration)), timeline.duration);
    const out = path.resolve(here, opt('out', `${timeline.file}.mp4`));
    const total = Math.round((to - from) * fps);
    const { proc, done } = ffmpeg([
      '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
      // sRGB-schermafdrukken → BT.709, zodat de huisstijlkleuren kloppen in elke speler
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', opt('crf', '18'), '-tune', 'animation',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      '-movflags', '+faststart',
      out,
    ], 'pipe');

    const started = Date.now();
    for (let i = 0; i < total; i++) {
      await frame(from + i / fps);
      const png = await page.screenshot({ type: 'png' });
      if (!proc.stdin.write(png)) await new Promise(r => proc.stdin.once('drain', r));
      if (i % fps === 0 || i === total - 1) {
        const secs = ((Date.now() - started) / 1000).toFixed(0);
        process.stdout.write(`\rframe ${i + 1}/${total}  (${secs} s)`);
      }
    }
    proc.stdin.end();
    await done;
    console.log('');
    // de poster is het slotbeeld, alleen bij een volledige render
    if (from === 0 && to === timeline.duration && !opt('out')) {
      const poster = path.join(here, `${timeline.file}-poster.jpg`);
      await frame(timeline.duration);
      await page.screenshot({ path: poster, type: 'jpeg', quality: 90 });
      console.log(poster);
    }
    // pas na de frames: soundCues rendert kort de klikmomenten
    if (!flag('no-audio')) await addSoundtrack(page, timeline, out, from, to);
    console.log(out);
  }

  await browser.close();
  server.close();
}
