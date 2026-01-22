/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Prefix for the rate limit key (e.g., 'transcribe', 'analyze') */
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // ms until reset
}

/**
 * Check rate limit for a given identifier (usually IP address)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // No existing record or expired
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetIn: config.windowMs,
    };
  }

  // Check if over limit
  if (record.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: config.limit - record.count,
    resetIn: record.resetTime - now,
  };
}

/**
 * Get IP address from request headers
 */
export function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const realIP = headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // Strict limit for expensive AI operations (OpenAI, Anthropic)
  aiOperation: {
    limit: 10,
    windowMs: 60 * 60 * 1000, // 10 requests per hour
    keyPrefix: 'ai',
  },

  // Medium limit for transcription
  transcribe: {
    limit: 20,
    windowMs: 60 * 60 * 1000, // 20 per hour
    keyPrefix: 'transcribe',
  },

  // Looser limit for form submissions
  formSubmission: {
    limit: 5,
    windowMs: 60 * 60 * 1000, // 5 per hour
    keyPrefix: 'form',
  },

  // Very strict limit for contact forms (anti-spam)
  contact: {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 3 per hour
    keyPrefix: 'contact',
  },
};
