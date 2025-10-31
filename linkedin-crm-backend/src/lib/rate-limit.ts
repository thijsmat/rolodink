// Rate limiting utility for API routes
// Limits: 100 requests per IP per hour (strict)

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (use Redis in production for distributed systems)
const store: RateLimitStore = {};

// Cleanup expired entries every hour
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 60 * 60 * 1000); // Run every hour

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

/**
 * Rate limit check - 100 requests per IP per hour
 * @param identifier - IP address or user ID
 * @returns RateLimitResult with success status and remaining requests
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  const limit = 100;
  const windowMs = 60 * 60 * 1000; // 1 hour in milliseconds
  const now = Date.now();

  const key = identifier;
  const entry = store[key];

  // No entry exists or window expired - create new entry
  if (!entry || entry.resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return {
      success: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
      limit,
    };
  }

  // Window still active - increment counter
  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      limit,
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
    limit,
  };
}

/**
 * Get client IP from request
 * Handles proxy headers (X-Forwarded-For, X-Real-IP)
 * SECURITY: Never returns 'unknown' to avoid shared rate limit bucket (DOS risk)
 */
export function getClientIP(request: Request): string {
  // Check X-Forwarded-For header (first IP if multiple)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim()).filter(Boolean);
    // Validate IP format before using
    if (ips.length > 0 && isValidIP(ips[0])) {
      return ips[0];
    }
  }

  // Check X-Real-IP header
  const realIP = request.headers.get('x-real-ip');
  if (realIP && isValidIP(realIP)) {
    return realIP;
  }

  // SECURITY FIX: Instead of 'unknown', generate per-request unique identifier
  // This prevents all requests without IP from sharing the same rate limit bucket
  // In serverless environments, this uses request URL + timestamp as fallback
  const requestId = `${request.url}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  console.warn(`[Rate Limit] Could not determine client IP, using request ID: ${requestId.substring(0, 50)}...`);
  return requestId;
}

/**
 * Basic IP address validation
 * Checks if string looks like a valid IP (IPv4 or IPv6)
 */
function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  
  // IPv4 pattern: 1-3 digits, dot, 1-3 digits, dot, 1-3 digits, dot, 1-3 digits
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  // IPv6 pattern: hex digits with colons (simplified check)
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  // Basic validation - check format
  if (ipv4Pattern.test(ip)) {
    // Validate IPv4 ranges (0-255 per octet)
    const parts = ip.split('.');
    return parts.length === 4 && parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  // IPv6 validation is more complex, but basic format check is sufficient here
  if (ipv6Pattern.test(ip)) {
    return true;
  }
  
  return false;
}

/**
 * Rate limit middleware wrapper for Next.js API routes
 * Returns response if rate limited, null if allowed
 */
export function rateLimitMiddleware(request: Request): Response | null {
  const ip = getClientIP(request);
  const result = checkRateLimit(ip);

  if (!result.success) {
    // Use secure CORS headers (will be applied by route handler)
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          // Note: CORS headers should be added by route handler using buildCorsHeaders
          // We omit Access-Control-Allow-Origin here to prevent reflection attacks
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

