/// <reference types="vite/client" />
/// <reference types="chrome" />

// Augment Vite's ImportMetaEnv interface with our custom environment variables
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

// Chrome API is globally available in extension context
// The @types/chrome package defines chrome on Window, but we need it as a global
// We extend the global scope to make chrome available globally (not just on window)
declare global {
  // Use the chrome namespace type that's already defined by @types/chrome
  // Since @types/chrome defines Window.chrome, we reference that type
  var chrome: Window['chrome'];
}

export {};