import { Context, Next } from 'hono'

/**
 * Sliding-window rate limiter for Cloudflare Workers (in-memory).
 *
 * Each Worker isolate has its own counter map, so this is
 * an approximate limiter — perfect for early-stage protection.
 * Upgrade to Cloudflare KV or Durable Objects for global accuracy.
 */

interface RateLimitConfig {
    /** Max requests per window per key */
    maxRequests: number
    /** Window size in milliseconds */
    windowMs: number
    /** Key extractor (default: userId from context) */
    keyExtractor?: (c: Context) => string
    /** Prefix for log messages */
    prefix?: string
}

interface WindowEntry {
    timestamps: number[]
}

const windows = new Map<string, WindowEntry>()

// Periodic cleanup every 5 minutes to prevent memory leaks
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 5 * 60 * 1000

function cleanup(windowMs: number) {
    const now = Date.now()
    if (now - lastCleanup < CLEANUP_INTERVAL) return
    lastCleanup = now

    const cutoff = now - windowMs
    for (const [key, entry] of windows) {
        entry.timestamps = entry.timestamps.filter(t => t > cutoff)
        if (entry.timestamps.length === 0) windows.delete(key)
    }
}

function createRateLimiter(config: RateLimitConfig) {
    const {
        maxRequests,
        windowMs,
        keyExtractor = (c: Context) => c.get('userId') || 'anonymous',
        prefix = 'RateLimit'
    } = config

    return async (c: Context, next: Next) => {
        const key = keyExtractor(c)
        const now = Date.now()
        const cutoff = now - windowMs

        // Get or create window entry
        let entry = windows.get(key)
        if (!entry) {
            entry = { timestamps: [] }
            windows.set(key, entry)
        }

        // Remove expired timestamps
        entry.timestamps = entry.timestamps.filter(t => t > cutoff)

        if (entry.timestamps.length >= maxRequests) {
            // Calculate when the earliest request in the window expires
            const oldestInWindow = entry.timestamps[0]
            const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000)

            console.log(`[${prefix}] Rate limit exceeded for key=${key} (${entry.timestamps.length}/${maxRequests})`)

            return c.json({
                error: 'AI_RATE_LIMITED',
                details: `Too many requests. Please try again in ${retryAfter} seconds.`,
                retryAfter
            }, 429 as any, {
                'Retry-After': String(retryAfter),
                'X-RateLimit-Limit': String(maxRequests),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(Math.ceil((oldestInWindow + windowMs) / 1000))
            })
        }

        // Record this request
        entry.timestamps.push(now)

        // Add rate limit headers to response
        await next()

        const remaining = Math.max(0, maxRequests - entry.timestamps.length)
        c.header('X-RateLimit-Limit', String(maxRequests))
        c.header('X-RateLimit-Remaining', String(remaining))

        // Background cleanup
        cleanup(windowMs)
    }
}

// ─── Pre-configured AI rate limiter ────────────────────────────────────────────
// Per-user: 5 AI requests per 60 seconds
export const aiRateLimit = createRateLimiter({
    maxRequests: 5,
    windowMs: 60 * 1000,
    prefix: 'AI-UserLimit'
})

// Global: 20 AI requests per second (across all users in this isolate)
export const aiGlobalRateLimit = createRateLimiter({
    maxRequests: 20,
    windowMs: 1000,
    keyExtractor: () => '__global__',
    prefix: 'AI-GlobalLimit'
})
