#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const extDir = path.join(repoRoot, 'linkedin-crm-extension');

// Target selection
let target = 'chrome';
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--target=')) target = arg.split('=')[1];
}

// Use per-target manifest path
let manifestPath = path.join(extDir, 'manifest.json');
if (target === 'firefox') {
  manifestPath = path.join(extDir, 'manifest-firefox.json');
}

function fail(message) {
  console.error(`Validation failed: ${message}`);
  process.exit(1);
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    fail(`Cannot read JSON at ${p}: ${e.message}`);
  }
}

console.log('==> Validating manifest.json');
if (!fs.existsSync(manifestPath)) fail('manifest.json missing');
const manifest = readJson(manifestPath);

if (manifest.manifest_version !== 3) fail('manifest_version must be 3');
['name', 'version', 'icons'].forEach((k) => {
  if (!manifest[k]) fail(`Missing required manifest field: ${k}`);
});

// Action popup or service worker
if (!manifest.action && !manifest.background) {
  fail('Expected action (popup) or background (service_worker)');
}

if (manifest.action?.default_popup) {
  const popup = path.join(extDir, manifest.action.default_popup);
  if (!fs.existsSync(popup)) fail(`default_popup missing: ${popup}`);
}

// Icons
const iconSizes = ['16', '32', '48', '128'];
iconSizes.forEach((size) => {
  const rel = manifest.icons?.[size];
  if (!rel) fail(`Missing icons[${size}]`);
  const p = path.join(extDir, rel);
  if (!fs.existsSync(p)) fail(`Icon file missing: ${p}`);
});

// Content scripts
if (manifest.content_scripts) {
  manifest.content_scripts.forEach((cs, i) => {
    (cs.js || []).forEach((rel) => {
      const p = path.join(extDir, rel);
      if (!fs.existsSync(p)) fail(`content_scripts[${i}].js missing: ${p}`);
    });
  });
}

// Host permissions and permissions sanity
if (!Array.isArray(manifest.host_permissions)) fail('host_permissions must be an array');
if (!Array.isArray(manifest.permissions)) fail('permissions must be an array');

// Context7-backed MV3 constraints (lightweight): no remote code via http in scripts
// Ensure no externally hosted JS referenced in HTML popup
const uiIndex = path.join(extDir, 'ui', 'dist', 'index.html');
if (fs.existsSync(uiIndex)) {
  const html = fs.readFileSync(uiIndex, 'utf8');
  if (/\ssrc=\"http:\/\//i.test(html)) fail('Insecure http script src in popup HTML');
}

console.log('==> Manifest validation passed');


