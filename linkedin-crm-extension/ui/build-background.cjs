const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Compile background script with tsc
console.log('Building background script...');
execSync('npx tsc --project tsconfig.background.json', {
    stdio: 'inherit',
    cwd: __dirname
});

// Rename main.js to background.js
const mainJsPath = path.join(__dirname, 'dist', 'main.js');
const backgroundJsPath = path.join(__dirname, 'dist', 'background.js');

if (fs.existsSync(mainJsPath)) {
    fs.renameSync(mainJsPath, backgroundJsPath);
    console.log('✓ Background script renamed to background.js');
} else {
    console.error('Warning: main.js not found at', mainJsPath);
}

console.log('✓ Background script built successfully');
