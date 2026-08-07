const { execFileSync } = require('node:child_process');

// Compile the content script with Vite (to bundle @rolodink/core).
// Mirrors build-background.cjs; runs after the popup and background builds in
// the `build` script, and before copy-assets.cjs.
//
// Vite is invoked by absolute path with execFileSync rather than `npx vite`
// through a shell: no PATH lookup, no shell interpolation (Sonar S4036), and
// it can only ever run the vite this package's lockfile installed.
const path = require('node:path');
const vitePkg = require.resolve('vite/package.json', { paths: [__dirname] });
const viteBin = path.join(path.dirname(vitePkg), 'bin', 'vite.js');

console.log('Building content script with Vite...');
try {
    execFileSync(process.execPath, [viteBin, 'build', '-c', 'vite.content.config.ts'], {
        stdio: 'inherit',
        cwd: __dirname
    });
    console.log('\u2713 Content script built successfully');
} catch (error) {
    console.error('Failed to build content script:', error);
    process.exit(1);
}
