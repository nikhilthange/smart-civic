/**
 * ─── Lightweight In-Memory / Telemetry TTL Cache Middleware ───────────────────
 * Caches high-frequency read-heavy endpoints (Complaints, Subways, CCTV, SITREP)
 * with automatic TTL expiration, user- & role-scoped cache keys (preventing IDOR leaks),
 * and pattern-based cache invalidation on mutations.
 */

const MAX_CACHE_ENTRIES = 5000;
const CLEANUP_INTERVAL_MS = 60 * 1000; // 60 seconds

const cacheStore = new Map();

// Periodic TTL Garbage Collection Sweep (Memory Hygiene)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (!entry || now > (entry.expiresAt || entry.expiry || 0)) {
      cacheStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

// Allow Node.js process to exit cleanly without being blocked by GC interval
if (cleanupTimer && typeof cleanupTimer.unref === "function") {
  cleanupTimer.unref();
}

/**
 * Cache middleware for read-heavy GET routes
 * @param {number} ttlSeconds - Time to live in seconds (default 10s)
 * @param {Object} options - { keyGenerator: (req) => string, userScoped: boolean }
 */
function cacheMiddleware(ttlSeconds = 10, { keyGenerator, userScoped = true } = {}) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    let key;
    if (typeof keyGenerator === "function") {
      key = keyGenerator(req);
    } else if (req.params && req.params.id) {
      const userId = (req.user?._id || req.user?.id || "anon").toString();
      const userRole = (req.user?.role || "public").toString();
      key = `complaint:${req.params.id}:${userId}:${userRole}`;
    } else {
      const userId = (userScoped && req.user) ? (req.user._id || req.user.id || "anon").toString() : "public";
      const userRole = (req.user?.role || "public").toString();
      const rawUrl = req.originalUrl || req.url;
      key = `${userId}:${userRole}:${rawUrl}`;
    }

    const cachedEntry = cacheStore.get(key);

    if (cachedEntry) {
      const now = Date.now();
      if (now < (cachedEntry.expiresAt || cachedEntry.expiry || 0)) {
        const remainingTtl = Math.max(1, Math.round(((cachedEntry.expiresAt || cachedEntry.expiry) - now) / 1000));
        if (!res.headersSent) {
          res.setHeader("Vary", "Authorization, Accept-Encoding");
          res.setHeader("X-Cache", "HIT");
          res.setHeader("X-Cache-TTL", remainingTtl);
          res.setHeader("Cache-Control", `private, max-age=${remainingTtl}`);
          return res.status(200).json(cachedEntry.data);
        }
        return res.json(cachedEntry.data);
      } else {
        // Expired
        cacheStore.delete(key);
      }
    }

    // Intercept response json method
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Strictly restrict caching to HTTP 2xx success responses (skip 4xx / 5xx error responses)
      const is2xx = res.statusCode >= 200 && res.statusCode < 300;
      if (is2xx && data && data.success !== false) {
        // Enforce upper-bound size limit with FIFO/LRU eviction to prevent memory leaks
        if (cacheStore.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = cacheStore.keys().next().value;
          if (oldestKey) cacheStore.delete(oldestKey);
        }

        cacheStore.set(key, {
          data,
          expiresAt: Date.now() + ttlSeconds * 1000,
          expiry: Date.now() + ttlSeconds * 1000,
        });

        if (!res.headersSent) {
          res.setHeader("Vary", "Authorization, Accept-Encoding");
          res.setHeader("X-Cache", "MISS");
          res.setHeader("Cache-Control", `private, max-age=${ttlSeconds}`);
        }
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Invalidates cache entries matching a key prefix / pattern
 * @param {string|string[]} pattern - Prefix, substring or array of patterns to match
 */
function invalidateCache(pattern) {
  if (!pattern) return;
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  for (const pat of patterns) {
    if (!pat) continue;
    const strPattern = String(pat);
    const lowerPattern = strPattern.toLowerCase();
    for (const key of cacheStore.keys()) {
      if (key.includes(strPattern) || key.toLowerCase().includes(lowerPattern)) {
        cacheStore.delete(key);
      }
    }
  }
}

/**
 * Clears all cached entries
 */
function clearAllCache() {
  cacheStore.clear();
}

module.exports = {
  cacheMiddleware,
  invalidateCache,
  clearAllCache,
};


