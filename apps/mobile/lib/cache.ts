/**
 * Simple module-level in-memory cache with TTL.
 * Persists across component mounts/unmounts within the same JS runtime session.
 * Used by data hooks to implement stale-while-revalidate:
 *   1. Return cached data instantly (no spinner)
 *   2. Silently revalidate in the background
 */

const store = new Map<string, { data: unknown; ts: number }>()

const TTL_MS = 30_000 // 30 seconds

export function getCache<T>(key: string): T | null {
    const entry = store.get(key)
    if (!entry) return null
    if (Date.now() - entry.ts > TTL_MS) {
        store.delete(key)
        return null
    }
    return entry.data as T
}

export function setCache<T>(key: string, data: T): void {
    store.set(key, { data, ts: Date.now() })
}

/** Remove a specific key (call after mutations) */
export function invalidateCache(...keys: string[]): void {
    keys.forEach(k => store.delete(k))
}

/** Remove all keys that start with a given prefix */
export function invalidateCachePrefix(prefix: string): void {
    for (const k of store.keys()) {
        if (k.startsWith(prefix)) store.delete(k)
    }
}

/** Clear the entire cache (useful on logout) */
export function clearAllCache(): void {
    store.clear()
}
