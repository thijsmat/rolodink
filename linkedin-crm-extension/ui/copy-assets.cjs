const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(__dirname, 'dist');

const assetsToCopy = [
    { src: 'manifest.json', dest: 'manifest.json' },
    { src: 'content.js', dest: 'content.js' },
    { src: 'icon.png', dest: 'icon.png' },
    { src: 'icons', dest: 'icons' }
];

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

console.log('==> Copying root assets to ui/dist...');

assetsToCopy.forEach(asset => {
    const srcPath = path.join(rootDir, asset.src);
    const destPath = path.join(distDir, asset.dest);

    if (fs.existsSync(srcPath)) {
        console.log(`Copying ${asset.src} -> ${asset.dest}`);
        fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
        console.warn(`⚠️ Warning: Source asset not found: ${srcPath}`);
    }
});

console.log('✅ Assets copied successfully.');
