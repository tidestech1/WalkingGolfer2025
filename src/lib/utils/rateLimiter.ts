/**
 * Simple rate limiter for API routes
 * Protects against spam and DoS attacks
 */

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Environment-based rate limiting configuration
const getRateLimitConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isSoftLaunch = process.env.SOFT_LAUNCH_MODE === 'true';
  
  if (!isProduction || isSoftLaunch) {
    // More lenient limits for development and soft-launch
    return {
      reviewSubmitPerIP: { limit: 50, window: 60 * 60 * 1000 }, // 50 per hour
      reviewSubmitPerUser: { limit: 100, window: 24 * 60 * 60 * 1000 }, // 100 per day
      default: { limit: 100, window: 15 * 60 * 1000 } // 100 per 15 minutes
    };
  }
  
  // Strict production limits
  return {
    reviewSubmitPerIP: { limit: 3, window: 60 * 60 * 1000 }, // 3 per hour
    reviewSubmitPerUser: { limit: 5, window: 24 * 60 * 60 * 1000 }, // 5 per day  
    default: { limit: 10, window: 15 * 60 * 1000 } // 10 per 15 minutes
  };
};

export function rateLimit(
  identifier: string, 
  limit?: number, 
  windowMs?: number,
  rateLimitType?: 'reviewSubmitPerIP' | 'reviewSubmitPerUser' | 'default'
): RateLimitResult {
  const config = getRateLimitConfig();
  
  // Use specific config if rateLimitType provided, otherwise use passed params or defaults
  let finalLimit: number;
  let finalWindow: number;
  
  if (rateLimitType && config[rateLimitType]) {
    finalLimit = config[rateLimitType].limit;
    finalWindow = config[rateLimitType].window;
  } else {
    finalLimit = limit ?? config.default.limit;
    finalWindow = windowMs ?? config.default.window;
  }
  
  const now = Date.now();
  const key = identifier;
  
  // Clean up expired entries
  if (rateLimitStore.has(key)) {
    const entry = rateLimitStore.get(key)!;
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
  
  const entry = rateLimitStore.get(key) || { count: 0, resetTime: now + finalWindow };
  
  if (entry.count >= finalLimit) {
    return {
      success: false,
      limit: finalLimit,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }
  
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    success: true,
    limit: finalLimit,
    remaining: finalLimit - entry.count,
    resetTime: entry.resetTime
  };
}

export function getRateLimitHeaders(rateLimitResult: RateLimitResult) {
  return {
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
  };
} 