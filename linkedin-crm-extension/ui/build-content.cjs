const { execSync } = require('child_process');

// Compile the content script with Vite (to bundle @rolodink/core).
// Mirrors build-background.cjs; runs after the popup and background builds in
// the `build` script, and before copy-assets.cjs.
console.log('Building content script with Vite...');
try {
    execSync('npx vite build -c vite.content.config.ts', {
        stdio: 'inherit',
        cwd: __dirname
    });
    console.log('✓ Content script built successfully');
} catch (error) {
    console.error('Failed to build content script:', error);
    process.exit(1);
}
