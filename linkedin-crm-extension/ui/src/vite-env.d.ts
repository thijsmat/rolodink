/// <reference types="vite/client" />
/// <reference types="chrome" />

// Chrome API is globally available in extension context
// The @types/chrome package defines chrome on Window, but we need it as a global
// We extend the global scope to make chrome available globally (not just on window)
declare global {
  // Augment Vite's ImportMetaEnv interface with our custom environment
  // variables. It has to sit inside `declare global`: `export {}` below makes
  // this file a module, and a top-level interface would stay module-local.
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
  }

  // Use the chrome namespace type that's already defined by @types/chrome
  // Since @types/chrome defines Window.chrome, we reference that type
  var chrome: Window['chrome'];
}

export {};