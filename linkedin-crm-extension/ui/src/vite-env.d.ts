/// <reference types="vite/client" />
/// <reference types="chrome" />

// Augment Vite's ImportMetaEnv interface with our custom environment variables
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

// Chrome API is globally available in extension context
// The @types/chrome package provides the chrome namespace types
// This makes chrome available without explicit imports
declare global {
  // eslint-disable-next-line no-var
  var chrome: chrome;
}

export {};