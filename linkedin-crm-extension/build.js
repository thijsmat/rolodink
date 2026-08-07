const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

const target = process.argv[2] || 'chrome'; // chrome, firefox, edge
const repoRoot = path.join(__dirname, '..');
const extDir = __dirname;
const uiDir = path.join(extDir, 'ui');
const distDir = path.join(repoRoot, 'dist');
const tmpDir = path.join(distDir, 'tmp', target);
const uiBuildDir = path.join(uiDir, 'dist');

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

  // Chrome/Edge ship the BUNDLED content script (ui/src/content/main.js ->
  // dist/content.js, built by build-content.cjs and copied in with the UI
  // artifacts above). Do not add a copy step for it here: the line that used
  // to sit here silently overwrote the bundle with the raw source after every
  // build. Firefox still runs its own hand-maintained content-firefox.js —
  // that fork is dissolved in its own PR, not smuggled into this one — and
  // the copy below deliberately overwrites the bundle in the Firefox package.
  if (target === 'firefox') {
    await fs.copy(path.join(extDir, 'content-firefox.js'), path.join(tmpDir, 'content.js'));
  }

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
