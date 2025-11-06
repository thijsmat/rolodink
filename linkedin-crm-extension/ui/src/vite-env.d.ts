/// <reference types="vite/client" />
/// <reference types="chrome" />

// Chrome API is globally available in extension context
// The @types/chrome package provides the chrome namespace types
// This makes chrome available without explicit imports
declare global {
  // eslint-disable-next-line no-var
  var chrome: chrome;
}

export {};