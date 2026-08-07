const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(__dirname, 'dist');

// content.js staat hier bewust NIET in. Het wordt door build-content.cjs als
// bundle in dist/ gezet; toen de ruwe bron nog in de extensieroot lag,
// overschreef deze kopieerstap hem stilletjes — de build slaagde, de zip was
// geldig, en het content script was toch de oude. Voeg hem niet terug toe.
const assetsToCopy = [
    { src: 'manifest.json', dest: 'manifest.json' },
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
