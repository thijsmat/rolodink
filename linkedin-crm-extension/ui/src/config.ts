const DEFAULT_API_BASE_URL = 'https://api.rolodink.app';

const envApiBaseUrl =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL).trim()
    : '';

export const API_BASE_URL = envApiBaseUrl || DEFAULT_API_BASE_URL;

// Supabase configuration
// NOTE: These MUST be set as environment variables - never hardcode in production!
// For Vite, use import.meta.env (not process.env)
// For development, set these in .env.local with VITE_ prefix
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate that Supabase credentials are provided
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '⚠️  Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables.',
  );
}

async function syncApiBaseUrl() {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage?.local?.get || !chrome.storage?.local?.set) {
      return;
    }
    const result = await chrome.storage.local.get('apiBaseUrl');
    if (result.apiBaseUrl !== API_BASE_URL) {
      await chrome.storage.local.set({ apiBaseUrl: API_BASE_URL });
    }
  } catch (error) {
    console.warn('Unable to sync API base URL to storage:', error);
  }
}

void syncApiBaseUrl();
