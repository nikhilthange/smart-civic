/**
 * ─── Security Middleware ───────────────────────────────────────────────────────
 * Central file for all production-grade security middleware.
 * Includes distributed Redis-backed rate limiting, Helmet, Mongo sanitization, and HPP.
 */

"use strict";

const helmet        = require("helmet");
const rateLimit     = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp           = require("hpp");

// ─── 1. Helmet — Secure HTTP headers ─────────────────────────────────────────
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://unpkg.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc:      ["'self'", "data:", "https:", "blob:", "https://*.tile.openstreetmap.org", "https://*.mapbox.com", "https://unpkg.com"],
      connectSrc:  ["'self'", "https:", "wss:", "ws:"],
      frameSrc:    ["https://api.razorpay.com"],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // allow Razorpay iframe
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge:            63072000, // 2 years
    includeSubDomains: true,
    preload:           true,
  },
});

// ─── 2. CORS — Fine-grained origin policy ────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || "http://localhost:5173")
      .split(",")
      .map(o => o.trim());

    // Allow requests with no origin (e.g. mobile apps, curl during dev)
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
    }
  },
  credentials:         true,
  methods:             ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders:      ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders:      ["X-Total-Count"],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on 204
};

// ─── 3. Distributed Redis Rate Limiter Store Helper ──────────────────────────
let redisStoreInstance = null;
try {
  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    const { RedisStore } = require("rate-limit-redis");
    const { createClient } = require("redis");
    const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`;
    const client = createClient({ url: redisUrl });
    client.connect().catch((err) => console.warn("RateLimit Redis fallback notice:", err.message));
    redisStoreInstance = new RedisStore({
      sendCommand: (...args) => client.sendCommand(args),
      prefix: "rl:",
    });
  }
} catch {
  // Graceful fallback to memory store
}

// ─── 4. Rate limiters with Granular Quotas ───────────────────────────────────
// Authenticated Admins: 500 req/15min | Public Citizen Submissions: 60 req/15min (2000 in dev/test)
const jwt = require("jsonwebtoken");

const defaultLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // 1. Check req.user if populated by route-level auth
    if (req.user && (req.user.role === "admin" || req.user.role === "officer")) {
      return 500;
    }
    // 2. Early decode Authorization header if available before route auth
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.decode(token);
        if (decoded && (decoded.role === "admin" || decoded.role === "officer")) {
          return 500;
        }
      }
    } catch {
      // Ignore parsing errors and fall back to default
    }
    return process.env.NODE_ENV === "production" ? 60 : 2000;
  },
  standardHeaders: true,
  legacyHeaders:   false,
  store:           redisStoreInstance || undefined,
  message:         { success: false, message: "Too many requests. Please try again in 15 minutes." },
  skip: (req) => process.env.NODE_ENV === "test",
});

// Auth / Login Routes: 10 attempts/15min (100 in dev/test)
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             process.env.NODE_ENV === "production" ? 10 : 100,
  standardHeaders: true,
  legacyHeaders:   false,
  store:           redisStoreInstance || undefined,
  message:         { success: false, message: "Too many login attempts. Please wait 15 minutes before trying again." },
  skip: (req) => process.env.NODE_ENV === "test",
});

// Upload Routes: 30 uploads/15min
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      process.env.NODE_ENV === "production" ? 30 : 100,
  store:    redisStoreInstance || undefined,
  message:  { success: false, message: "Upload rate limit reached. Please try again in 15 minutes." },
  skip: (req) => process.env.NODE_ENV === "test",
});

// ─── 5. MongoDB Operator Injection Sanitizer ──────────────────────────────────
// Strips characters like $ and . from req.body, req.params, req.query
const mongoSanitizer = mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    console.warn(`[SECURITY] Mongo injection attempt sanitized. Key: ${key} | IP: ${req.ip}`);
  },
});

// ─── 6. HPP — HTTP Parameter Pollution Prevention ────────────────────────────
// Prevents duplicate query string params (e.g. ?sort=asc&sort=malicious)
const hppMiddleware = hpp({
  whitelist: ["status", "category", "priority"],
});

// ─── 7. Input sanitizer — strips HTML tags from string fields ─────────────────
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === "string") {
        obj[key] = obj[key]
          .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
          .replace(/on\w+="[^"]*"/gi, "")
          .replace(/on\w+='[^']*'/gi, "")
          .replace(/javascript:/gi, "");
      } else if (typeof obj[key] === "object") {
        sanitize(obj[key]);
      }
    }
  };
  sanitize(req.body);
  sanitize(req.query);
  next();
};

module.exports = {
  helmetMiddleware,
  corsOptions,
  defaultLimiter,
  authLimiter,
  uploadLimiter,
  mongoSanitizer,
  hppMiddleware,
  sanitizeInput,
};
