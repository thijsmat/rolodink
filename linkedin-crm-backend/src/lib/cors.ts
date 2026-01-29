// CORS utility with secure origin whitelisting
// Prevents CORS reflection attacks by only allowing trusted origins

/**
 * Allowed origins for CORS
 * SECURITY: Whitelist only - never use wildcard or reflect untrusted origins
 */
const ALLOWED_ORIGINS = [
  // Chrome Extension IDs (add your extension ID here)
  'chrome-extension://hidgijlndiamdghcfjloaihnakmllimd',
  'chrome-extension://feflgkngikoleafnbjmgipfcbfcaejdd',

  // Firefox Extension IDs (if applicable)
  // 'moz-extension://...',

  // Edge Extension IDs (if applicable)
  // 'extension://...',

  // Development origins (allow in development and testing)
  // Note: For production testing, add specific origins via environment variable
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ] : []),

  // Allow additional origins via environment variable (comma-separated)
  // Useful for testing production builds locally or allowing specific test domains
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) : []),
];

/**
 * Check if origin is allowed
 * @param origin - Origin header value from request
 * @returns true if origin is in whitelist
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  // Exact match against whitelist
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Get allowed origin for CORS response
 * SECURITY: Returns exact origin if whitelisted, null otherwise (no wildcard)
 * @param request - NextRequest object
 * @returns Allowed origin string or null
 */
export function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get('origin') || request.headers.get('Origin');

  if (!origin) {
    // No origin header - might be same-origin request or missing header
    // In serverless/server context, we can't determine origin reliably
    // Return null to deny CORS (client should handle same-origin requests)
    return null;
  }

  if (isOriginAllowed(origin)) {
    return origin;
  }

  // Origin not in whitelist - deny CORS
  console.warn(`[CORS] Blocked origin: ${origin}`);
  return null;
}

/**
 * Build CORS headers with secure origin whitelisting
 * @param request - NextRequest object
 * @returns CORS headers object
 */
export function buildCorsHeaders(request: Request): Record<string, string> {
  const allowedOrigin = getAllowedOrigin(request);

  // If no allowed origin, return minimal headers (deny CORS)
  if (!allowedOrigin) {
    return {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'false',
      // Note: Access-Control-Allow-Origin is intentionally omitted when origin is not allowed
    };
  }

  // Return CORS headers with whitelisted origin
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'false',
    'Vary': 'Origin', // Important: tells caches to vary on Origin header
  };
}

