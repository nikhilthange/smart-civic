/**
 * ─── Lightweight In-Memory / Telemetry TTL Cache Middleware ───────────────────
 * Caches high-frequency read-heavy telemetry endpoints (Subways, CCTV, SITREP)
 * with automatic TTL expiration and pattern-based cache invalidation on writes.
 */

const cacheStore = new Map();

/**
 * Cache middleware for read-heavy GET routes
 * @param {number} ttlSeconds - Time to live in seconds (default 20s)
 */
function cacheMiddleware(ttlSeconds = 20) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedEntry = cacheStore.get(key);

    if (cachedEntry) {
      const now = Date.now();
      if (now < cachedEntry.expiresAt) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("X-Cache-TTL", Math.round((cachedEntry.expiresAt - now) / 1000));
        return res.status(200).json(cachedEntry.data);
      } else {
        // Expired
        cacheStore.delete(key);
      }
    }

    // Intercept response json method
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode === 200) {
        cacheStore.set(key, {
          data,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
        res.setHeader("X-Cache", "MISS");
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Invalidates cache entries matching a key prefix / pattern
 * @param {string} pattern - Prefix or substring to match
 */
function invalidateCache(pattern) {
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
    }
  }
}

/**
 * Clears all cached telemetry entries
 */
function clearAllCache() {
  cacheStore.clear();
}

module.exports = {
  cacheMiddleware,
  invalidateCache,
  clearAllCache,
};
