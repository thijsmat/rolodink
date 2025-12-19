#!/usr/bin/env node

// Post-build script to remove block comments from built JavaScript files
// while keeping line comments intact for Firefox AMO validation

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');

function removeBlockComments(content) {
    // Remove block comments (/* ... */) but keep line comments (//)
    // This regex matches /* followed by anything (non-greedy) until */
    return content.replace(/\/\*[\s\S]*?\*\//g, '');
}

function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleaned = removeBlockComments(content);

    if (content !== cleaned) {
        fs.writeFileSync(filePath, cleaned, 'utf8');
        console.log(`✓ Removed block comments from: ${path.relative(distDir, filePath)}`);
    }
}

function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            processFile(fullPath);
        }
    }
}

console.log('🧹 Removing block comments from built files...');
processDirectory(distDir);
console.log('✅ Done!');
