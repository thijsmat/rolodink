const DEFAULT_API_BASE_URL = 'https://api.rolodink.app';

const envApiBaseUrl =
  typeof import.meta !== 'undefined' && typeof import.meta.env?.VITE_API_BASE_URL === 'string'
    ? import.meta.env.VITE_API_BASE_URL.trim().replace(/\/$/, '')
    : '';

export const API_BASE_URL = envApiBaseUrl.length > 0 ? envApiBaseUrl : DEFAULT_API_BASE_URL;

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

import { getBrowserAPI } from './utils/browser';

async function syncConfig() {
  try {
    const browserAPI = getBrowserAPI();
    if (!browserAPI?.storage?.local) {
      return;
    }

    const result = await browserAPI.storage.local.get(['apiBaseUrl', 'supabaseUrl']);

    const updates: Record<string, string> = {};
    if (result.apiBaseUrl !== API_BASE_URL) {
      updates.apiBaseUrl = API_BASE_URL;
    }
    if (result.supabaseUrl !== SUPABASE_URL) {
      updates.supabaseUrl = SUPABASE_URL;
    }

    if (Object.keys(updates).length > 0) {
      await browserAPI.storage.local.set(updates);
    }
  } catch (error) {
    console.warn('Unable to sync config to storage:', error);
  }
}

void syncConfig();
