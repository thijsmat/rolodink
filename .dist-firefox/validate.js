#!/usr/bin/env node
/**
 * Validation script for Chrome Extension
 * Verifies manifest.json references valid files and permissions are used
 */

const fs = require('fs');
const path = require('path');

const EXTENSION_ROOT = __dirname;
const MANIFEST_PATH = path.join(EXTENSION_ROOT, 'manifest.json');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

let errorCount = 0;
let warningCount = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  errorCount++;
  log(`❌ ERROR: ${message}`, colors.red);
}

function warning(message) {
  warningCount++;
  log(`⚠️  WARNING: ${message}`, colors.yellow);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

// Read manifest.json
function readManifest() {
  try {
    const content = fs.readFileSync(MANIFEST_PATH, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    error(`Failed to read manifest.json: ${err.message}`);
    process.exit(1);
  }
}

// Check if file exists
function fileExists(relativePath) {
  const fullPath = path.join(EXTENSION_ROOT, relativePath);
  return fs.existsSync(fullPath);
}

// Check icon dimensions
function checkIconDimensions(relativePath, expectedSize) {
  // Note: This is a basic check. For production, use a proper image library
  const fullPath = path.join(EXTENSION_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    return false;
  }
  
  const stats = fs.statSync(fullPath);
  if (stats.size === 0) {
    error(`Icon ${relativePath} is empty (0 bytes)`);
    return false;
  }
  
  // Basic validation passed
  return true;
}

// Validate icons
function validateIcons(manifest) {
  info('Validating icons...');
  
  // Check action.default_icon
  if (manifest.action && manifest.action.default_icon) {
    const iconPath = manifest.action.default_icon;
    if (fileExists(iconPath)) {
      success(`Action icon found: ${iconPath}`);
    } else {
      error(`Action icon not found: ${iconPath}`);
    }
  }
  
  // Check icons object
  if (manifest.icons) {
    const expectedSizes = { '16': 16, '32': 32, '48': 48, '128': 128 };
    
    for (const [size, iconPath] of Object.entries(manifest.icons)) {
      if (fileExists(iconPath)) {
        if (checkIconDimensions(iconPath, expectedSizes[size])) {
          success(`Icon ${size}x${size} found: ${iconPath}`);
        }
      } else {
        error(`Icon ${size}x${size} not found: ${iconPath}`);
      }
    }
  }
}

// Validate content scripts
function validateContentScripts(manifest) {
  info('Validating content scripts...');
  
  if (manifest.content_scripts) {
    manifest.content_scripts.forEach((script, index) => {
      script.js?.forEach(jsFile => {
        if (fileExists(jsFile)) {
          success(`Content script found: ${jsFile}`);
        } else {
          error(`Content script not found: ${jsFile}`);
        }
      });
      
      script.css?.forEach(cssFile => {
        if (fileExists(cssFile)) {
          success(`Content CSS found: ${cssFile}`);
        } else {
          error(`Content CSS not found: ${cssFile}`);
        }
      });
    });
  }
}

// Validate popup
function validatePopup(manifest) {
  info('Validating popup...');
  
  if (manifest.action && manifest.action.default_popup) {
    const popupPath = manifest.action.default_popup;
    if (fileExists(popupPath)) {
      success(`Popup HTML found: ${popupPath}`);
    } else {
      error(`Popup HTML not found: ${popupPath}`);
    }
  }
}

// Check for unused permissions
function checkPermissions(manifest) {
  info('Checking permissions usage...');
  
  const permissions = manifest.permissions || [];
  const contentScriptFiles = [];
  
  // Collect all content script files
  if (manifest.content_scripts) {
    manifest.content_scripts.forEach(script => {
      script.js?.forEach(jsFile => {
        contentScriptFiles.push(jsFile);
      });
    });
  }
  
  // Read content script files
  let allCode = '';
  contentScriptFiles.forEach(file => {
    const fullPath = path.join(EXTENSION_ROOT, file);
    if (fs.existsSync(fullPath)) {
      allCode += fs.readFileSync(fullPath, 'utf8');
    }
  });
  
  // Check each permission
  const permissionChecks = {
    'activeTab': { 
      patterns: ['chrome.tabs.query', 'chrome.tabs.sendMessage'],
      found: false 
    },
    'storage': { 
      patterns: ['chrome.storage'],
      found: false 
    },
    'tabs': { 
      patterns: ['chrome.tabs'],
      found: false 
    },
    'scripting': { 
      patterns: ['chrome.scripting'],
      found: false 
    },
  };
  
  // Check if permissions are used
  permissions.forEach(permission => {
    if (permissionChecks[permission]) {
      const check = permissionChecks[permission];
      check.found = check.patterns.some(pattern => allCode.includes(pattern));
      
      if (check.found) {
        success(`Permission "${permission}" is used`);
      } else {
        warning(`Permission "${permission}" might not be used in content scripts`);
        info(`   Note: It might be used in popup/background. Manual verification recommended.`);
      }
    }
  });
}

// Validate web accessible resources
function validateWebAccessibleResources(manifest) {
  info('Validating web accessible resources...');
  
  if (manifest.web_accessible_resources) {
    manifest.web_accessible_resources.forEach((resource, index) => {
      if (resource.resources) {
        resource.resources.forEach(pattern => {
          // Basic validation - just check if it's a valid pattern
          success(`Web accessible resource pattern: ${pattern}`);
        });
      }
    });
  }
}

// Main validation
function main() {
  log('\n🔍 Validating Chrome Extension...', colors.cyan);
  log('='.repeat(50), colors.cyan);
  
  const manifest = readManifest();
  
  // Run validations
  validateIcons(manifest);
  validateContentScripts(manifest);
  validatePopup(manifest);
  validateWebAccessibleResources(manifest);
  checkPermissions(manifest);
  
  // Summary
  log('\n' + '='.repeat(50), colors.cyan);
  if (errorCount === 0 && warningCount === 0) {
    success('✨ All validations passed!');
    process.exit(0);
  } else {
    if (errorCount > 0) {
      error(`Found ${errorCount} error(s)`);
    }
    if (warningCount > 0) {
      warning(`Found ${warningCount} warning(s)`);
    }
    process.exit(errorCount > 0 ? 1 : 0);
  }
}

main();

