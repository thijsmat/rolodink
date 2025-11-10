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

  if (!(await fs.pathExists(uiBuildDir))) {
    throw new Error(`UI build output not found at ${uiBuildDir}. Did Vite finish successfully?`);
  }

  console.log('==> Preparing clean dist folder...');
  await fs.emptyDir(tmpDir);

  const manifestFile = target === 'firefox' ? 'manifest-firefox.json' : 'manifest.json';
  const contentScriptFile = target === 'firefox' ? 'content-firefox.js' : 'content.js';

  console.log('==> Copying UI build artifacts...');
  await fs.copy(uiBuildDir, tmpDir);

  console.log('==> Copying extension assets...');
  await fs.copy(path.join(extDir, 'icons'), path.join(tmpDir, 'icons'));
  await fs.copy(path.join(extDir, manifestFile), path.join(tmpDir, 'manifest.json'));
  await fs.copy(path.join(extDir, contentScriptFile), path.join(tmpDir, 'content.js'));
  await fs.copy(path.join(extDir, 'icon.png'), path.join(tmpDir, 'icon.png'));

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
