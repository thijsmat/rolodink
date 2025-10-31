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
 */
export function getClientIP(request: Request): string {
  // Check X-Forwarded-For header (first IP if multiple)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim());
    return ips[0] || 'unknown';
  }

  // Check X-Real-IP header
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback (won't work in serverless, but helps in local dev)
  return 'unknown';
}

/**
 * Rate limit middleware wrapper for Next.js API routes
 * Returns response if rate limited, null if allowed
 */
export function rateLimitMiddleware(request: Request): Response | null {
  const ip = getClientIP(request);
  const result = checkRateLimit(ip);

  if (!result.success) {
    const origin = request.headers.get('origin') || '*';
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
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

