const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Compile background script with Vite (to bundle dependencies)
console.log('Building background script with Vite...');
try {
    execSync('npx vite build -c vite.background.config.ts', {
        stdio: 'inherit',
        cwd: __dirname
    });
    console.log('✓ Background script built successfully');
} catch (error) {
    console.error('Failed to build background script:', error);
    process.exit(1);
}
