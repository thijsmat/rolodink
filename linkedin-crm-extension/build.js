const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const crypto = require('node:crypto');
const { execSync } = require('child_process');

const target = process.argv[2] || 'chrome'; // chrome, firefox, edge
const repoRoot = path.join(__dirname, '..');
const extDir = __dirname;
const uiDir = path.join(extDir, 'ui');
const distDir = path.join(repoRoot, 'dist');
const tmpDir = path.join(distDir, 'tmp', target);
const uiBuildDir = path.join(uiDir, 'dist');

// Chrome derives an extension's ID from its public key: the first 16 bytes of
// SHA-256 over the DER-encoded key, with each nibble mapped 0-15 onto a-p.
function extensionIdFromKey(base64Key) {
  const digest = crypto.createHash('sha256').update(Buffer.from(base64Key, 'base64')).digest();
  return Array.from(digest.subarray(0, 16))
    .flatMap(byte => [byte >> 4, byte & 0x0f])
    .map(nibble => String.fromCodePoint(0x61 + nibble))
    .join('');
}

// Stores that refuse a package whose manifest carries `key`.
//
// Microsoft Partner Center validates the uploaded manifest and rejects it
// outright: "The manifest shouldn't contain the key field." That is a hard
// validation error, not a warning - the submission never reaches review, and
// the publish workflow fails with "Failed to validate the add-on". It is what
// broke the v1.3.4 Edge publish while Chrome accepted the identical field.
//
// The cost is real but small and only local: an Edge build loaded unpacked
// gets a path-derived ID instead of the store's, so its OAuth redirect
// (https://<id>.chromiumapp.org/provider_cb) will not match Supabase's
// allowlist. That affects testing sign-in in an unpacked Edge build, nothing
// users see - the store build gets its identity from Partner Center regardless.
// Chrome, which is where the unpacked browser checks actually happen, keeps
// the key.
const TARGETS_REJECTING_MANIFEST_KEY = new Set(['edge']);

// Pin the packaged manifest to the store's identity. See extension-keys.json
// for why. Recomputing the ID here means a wrong key fails the build instead of
// producing a package that loads under some other extension's identity.
async function applyExtensionKey(manifestPath) {
  const entry = require(path.join(extDir, 'extension-keys.json'))[target];
  if (!entry) {
    console.log(`==> No signing key configured for ${target}, leaving manifest identity unpinned`);
    return;
  }

  // Verified even when the key is not written, because the check is about the
  // file being right rather than about this particular package - a swapped or
  // truncated key should fail every build, not only the ones that use it.
  const derivedId = extensionIdFromKey(entry.key);
  if (derivedId !== entry.id) {
    throw new Error(
      `extension-keys.json: the ${target} key derives to ${derivedId}, not the declared ${entry.id}`
    );
  }

  if (TARGETS_REJECTING_MANIFEST_KEY.has(target)) {
    console.log(`==> ${target} rejects a manifest key; leaving the packaged manifest unpinned (store item ${entry.id})`);
    return;
  }

  const manifest = await fs.readJson(manifestPath);
  manifest.key = entry.key;
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });
  console.log(`==> Pinned ${target} extension ID to ${entry.id}`);
}

async function build() {
  console.log(`==> Building UI for ${target}...`);
  execSync('npm run build', { cwd: uiDir, stdio: 'inherit' });

  if (target === 'firefox') {
    console.log('==> Running Firefox specific post-build steps...');
    execSync('npm run postbuild:firefox', { cwd: uiDir, stdio: 'inherit' });
  }

  if (!(await fs.pathExists(uiBuildDir))) {
    throw new Error(`UI build output not found at ${uiBuildDir}. Did Vite finish successfully?`);
  }
  console.log('==> Preparing clean dist folder...');
  await fs.emptyDir(tmpDir);

  // Edge uses the same manifest as Chrome (Chromium-based)
  const manifestFile = target === 'firefox' ? 'manifest-firefox.json' : 'manifest.json';

  console.log('==> Copying UI build artifacts...');
  await fs.copy(uiBuildDir, tmpDir);

  console.log('==> Copying extension assets...');
  await fs.copy(path.join(extDir, 'icons'), path.join(tmpDir, 'icons'));
  await fs.copy(path.join(extDir, manifestFile), path.join(tmpDir, 'manifest.json'));
  await fs.copy(path.join(extDir, 'icon.png'), path.join(tmpDir, 'icon.png'));

  await applyExtensionKey(path.join(tmpDir, 'manifest.json'));

  // Every target ships the BUNDLED content script (ui/src/content/main.js ->
  // dist/content.js, built by build-content.cjs and copied in with the UI
  // artifacts above). Do not add a copy step for it here: the line that used
  // to sit here silently overwrote the bundle with the raw source after every
  // build.
  //
  // Firefox used to be the exception, overwriting the bundle with its own
  // content-firefox.js. That file is gone. It was 353 lines against 900 and
  // had no injectContextField at all, so Firefox users never had the inline
  // note card - a missing feature dressed up as a platform difference. The
  // platform difference that was real (browser.* takes promises, chrome.*
  // takes callbacks) lives in ui/src/content/browser-api.ts now, where it is
  // tested against a fake of each.

  // The manifest declares content.js literally; a package without it is a
  // broken extension, so fail the build rather than zip it up.
  if (!(await fs.pathExists(path.join(tmpDir, 'content.js')))) {
    throw new Error('content.js missing from package - did the content script bundle build?');
  }

  const version = require(path.join(tmpDir, 'manifest.json')).version;
  const zipName = `Rolodink-${target}-v${version}.zip`;
  const zipPath = path.join(distDir, zipName);

  console.log(`==> Creating ZIP: ${zipPath}`);
  await fs.ensureDir(distDir);

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(tmpDir, false);

  await archive.finalize();

  console.log(`✅ Extension for ${target} successfully built: ${zipPath}`);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
