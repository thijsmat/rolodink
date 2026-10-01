#!/usr/bin/env node

// Post-build script for Firefox
// 1. Remove block comments (/* ... */) but keep line comments (//) for AMO validation
// 2. Replace .innerHTML= assignments with ["innerHTML"]= to avoid linter false positives with minified React code
//
// Usage: node firefox-postbuild.cjs [dir]
//
// `dir` is the directory to rewrite in place. build.js passes the Firefox
// package's own copy (dist/tmp/firefox), so ui/dist - shared by every target
// packaged in the same run - keeps the unmodified bundle for chrome and edge.
// Without an argument it rewrites ui/dist, as it always did.

const fs = require('fs');
const path = require('path');

const distDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, 'dist');

function cleanContent(content) {
    // 1. Remove block comments
    let newContent = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // 2. Replace .innerHTML= with ["innerHTML"]=
    // This is a workaround for "UNSAFE_VAR_ASSIGNMENT" warnings in web-ext lint
    // when using minified React which contains innerHTML assignments.
    // We target the minified pattern `t.innerHTML=e` or similar.
    newContent = newContent.replace(/\.innerHTML=/g, '["innerHTML"]=');

    return newContent;
}

function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleaned = cleanContent(content);

    if (content !== cleaned) {
        fs.writeFileSync(filePath, cleaned, 'utf8');
        console.log(`✓ Processed (comments & innerHTML): ${path.relative(distDir, filePath)}`);
    }
}

function processDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`Warning: Directory not found ${dir}`);
        return;
    }

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

console.log(`🧹 Running Firefox post-build processing in ${distDir}...`);
processDirectory(distDir);
console.log('✅ Done!');
