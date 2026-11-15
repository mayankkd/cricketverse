/**
 * CRICKETVERSE In-Memory Sliding Window Rate Limiter Middleware
 * Protects APIs from abuse, brute-force, and high-frequency spam.
 */

// Global tracking store: IP/Key -> { count, resetTime }
const requestCounts = new Map();

// Periodically clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (record.resetTime <= now) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Factory to create rate limiter middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60,000ms = 1 min)
 * @param {number} options.max - Max requests per window (default: 120)
 * @param {string} options.message - Error message when rate limit exceeded
 * @param {Function} options.keyGenerator - Function to extract unique client key
 */
const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 120;
  const message = options.message || 'Too many requests from this client. Please slow down.';
  const keyGenerator = options.keyGenerator || ((req) => {
    return req.user?._id || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  });

  return (req, res, next) => {
    // Bypass in test environment unless explicitly testing rate limiter
    if (process.env.DISABLE_RATE_LIMIT === 'true' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    // Optional bypass header for automated internal test suites
    if (req.headers['x-test-bypass-ratelimit'] === 'cricketverse-internal-test') {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    let record = requestCounts.get(key);

    if (!record || record.resetTime <= now) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      requestCounts.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    // Set standard RateLimit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfterSeconds: resetSeconds
      });
    }

    next();
  };
};

// Default global API rate limiter (120 req/min)
const apiRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'API rate limit exceeded. Please try again in a few moments.'
});

// Stricter auth rate limiter (30 req/min) for login/register brute-force prevention
const authRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please wait 60 seconds before trying again.'
});

const resetRateLimiterStore = () => {
  requestCounts.clear();
};

module.exports = {
  rateLimiter,
  apiRateLimiter,
  authRateLimiter,
  resetRateLimiterStore
};
