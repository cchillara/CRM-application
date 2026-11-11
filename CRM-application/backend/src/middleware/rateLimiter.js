
import rateLimit from "express-rate-limit";

/**
 * Shared handler for rate-limit responses.
 *
 * Uses the same ApiError-style JSON envelope as the rest of
 * the application so the frontend gets a consistent shape.
 */
const rateLimitHandler = (req, res) => {
    return res.status(429).json({
        statusCode: 429,
        data: null,
        success: false,
        message: "Too many requests. Please slow down and try again later.",
        errors: [],
        requestId: req.id ?? null,
    });
};

/**
 * createLimiter(options)
 *
 * Factory that builds a reusable express-rate-limit middleware.
 *
 * Parameters (all optional):
 *   windowMs   - time window in milliseconds (default: 15 min)
 *   max        - max requests per window per IP (default: 100)
 *   skipFn     - function(req) => bool to bypass limiting
 */
export const createLimiter = ({
    windowMs = 15 * 60 * 1000,
    max = 100,
    skipFn = undefined,
} = {}) => {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,   // Return rate limit info in `RateLimit-*` headers
        legacyHeaders: false,     // Disable `X-RateLimit-*` headers
        handler: rateLimitHandler,
        skip: skipFn,
    });
};

/* ------------------------------------------------------------------
 * Auth route limiter
 * ------------------------------------------------------------------*/

/**
 * Tight limiter for /api/v1/auth/* to prevent registration floods
 * and brute-force token probing.
 * 20 requests per 15 minutes per IP.
 */
export const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
});

/* ------------------------------------------------------------------
 * Super Admin limiter
 * ------------------------------------------------------------------*/

/**
 * Applied to all routes in the Super Admin router.
 * 100 requests per 15 minutes per IP.
 */
export const superAdminLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

/* ------------------------------------------------------------------
 * Client Admin limiters (existing - unchanged)
 * ------------------------------------------------------------------*/

/**
 * General Client Admin API limiter.
 * 200 requests per 15 minutes per IP.
 */
export const clientAdminLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 200,
});

/**
 * Strict limiter for sensitive write operations such as
 * user creation, deletion, and status changes.
 * 30 requests per 15 minutes per IP.
 */
export const sensitiveWriteLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
});

/**
 * Limiter for password change operations.
 * 10 requests per 60 minutes to slow credential-stuffing.
 */
export const passwordChangeLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
});