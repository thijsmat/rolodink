#!/usr/bin/env node
/**
 * Production build script for Chrome Extension
 * Creates a clean dist folder and ZIP file ready for Chrome Web Store submission
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXTENSION_ROOT = __dirname;
const DIST_DIR = path.join(EXTENSION_ROOT, 'dist');
const UI_DIST_DIR = path.join(EXTENSION_ROOT, 'ui', 'dist');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function step(message) {
  log(`\n🔄 ${message}...`, colors.cyan);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

// Clean dist directory
function cleanDist() {
  step('Cleaning dist directory');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
  success('Dist directory cleaned');
}

// Build UI
function buildUI() {
  step('Building UI with Vite');
  try {
    execSync('npm run build', {
      cwd: path.join(EXTENSION_ROOT, 'ui'),
      stdio: 'inherit'
    });
    success('UI built successfully');
  } catch (err) {
    error('UI build failed');
    process.exit(1);
  }
}

// Copy files
function copyFile(src, dest) {
  const srcPath = path.join(EXTENSION_ROOT, src);
  const destPath = path.join(DIST_DIR, dest);

  // Ensure destination directory exists
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    return true;
  }
  return false;
}

function copyDirectory(src, dest) {
  const srcPath = path.join(EXTENSION_ROOT, src);
  const destPath = path.join(DIST_DIR, dest);

  if (!fs.existsSync(srcPath)) {
    return false;
  }

  fs.mkdirSync(destPath, { recursive: true });

  const items = fs.readdirSync(srcPath);
  items.forEach(item => {
    const srcItem = path.join(srcPath, item);
    const destItem = path.join(destPath, item);

    if (fs.statSync(srcItem).isDirectory()) {
      copyDirectory(path.relative(EXTENSION_ROOT, srcItem), path.relative(DIST_DIR, destItem));
    } else {
      fs.copyFileSync(srcItem, destItem);
    }
  });

  return true;
}

// Copy all necessary files
function copyFiles() {
  step('Copying extension files to dist');

  // Copy manifest.json
  if (copyFile('manifest.json', 'manifest.json')) {
    success('Copied manifest.json');
  } else {
    error('manifest.json not found');
    process.exit(1);
  }

  // Copy icon.png
  if (copyFile('icon.png', 'icon.png')) {
    success('Copied icon.png');
  } else {
    error('icon.png not found');
    process.exit(1);
  }

  // Copy icons directory
  if (copyDirectory('icons', 'icons')) {
    success('Copied icons/ directory');
  } else {
    error('icons/ directory not found');
    process.exit(1);
  }

  // Copy content.js
  if (copyFile('content.js', 'content.js')) {
    success('Copied content.js');
  } else {
    error('content.js not found');
    process.exit(1);
  }

  // Copy UI dist
  if (copyDirectory('ui/dist', '')) {
    success('Copied ui/dist directory');
  } else {
    error('ui/dist not found - did UI build fail?');
    process.exit(1);
  }
}

// Create ZIP file
function createZip() {
  step('Creating ZIP file');

  const manifest = JSON.parse(fs.readFileSync(path.join(EXTENSION_ROOT, 'manifest.json'), 'utf8'));
  const version = manifest.version;
  const zipName = `rolodink-v${version}-chrome.zip`;
  const zipPath = path.join(EXTENSION_ROOT, zipName);

  // Remove old ZIP if exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  try {
    // Create ZIP using system zip command
    execSync(`cd dist && zip -r ../${zipName} . -x "*.DS_Store" "*.map"`, {
      cwd: EXTENSION_ROOT,
      stdio: 'inherit'
    });
    success(`Created ${zipName}`);

    // Show ZIP stats
    const stats = fs.statSync(zipPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    log(`   📦 Size: ${sizeInMB} MB`, colors.cyan);

    return zipName;
  } catch (err) {
    error('Failed to create ZIP file');
    error('Make sure "zip" command is available on your system');
    process.exit(1);
  }
}

// Verify ZIP contents
function verifyZip(zipName) {
  step('Verifying ZIP contents');

  try {
    const output = execSync(`unzip -l ${zipName}`, {
      cwd: EXTENSION_ROOT,
      encoding: 'utf8'
    });

    const requiredFiles = [
      'manifest.json',
      'icon.png',
      'icons/icon16.png',
      'icons/icon32.png',
      'icons/icon48.png',
      'icons/icon128.png',
      'content.js',
      'index.html'
    ];

    let allFound = true;
    requiredFiles.forEach(file => {
      if (output.includes(file)) {
        success(`  ✓ ${file}`);
      } else {
        error(`  ✗ ${file} missing!`);
        allFound = false;
      }
    });

    if (!allFound) {
      error('ZIP verification failed - some required files are missing');
      process.exit(1);
    }

    success('ZIP verification passed');
  } catch (err) {
    error('Failed to verify ZIP contents');
    process.exit(1);
  }
}

// Main build process
function main() {
  log('\n🚀 Building Chrome Extension for Production', colors.cyan);
  log('='.repeat(60), colors.cyan);

  cleanDist();
  buildUI();
  copyFiles();
  const zipName = createZip();
  verifyZip(zipName);

  log('\n' + '='.repeat(60), colors.cyan);
  log('✨ Production build complete!', colors.green);
  log(`\n📦 Package: ${zipName}`, colors.green);
  log('\n🎯 Next steps:', colors.cyan);
  log('  1. Test locally: Load dist/ folder in chrome://extensions/', colors.reset);
  log('  2. Test ZIP: Extract and load in chrome://extensions/', colors.reset);
  log('  3. Upload to Chrome Web Store', colors.reset);
}

main();

