/**
 * ─── Security Middleware ───────────────────────────────────────────────────────
 * Central file for all production-grade security middleware.
 * Imported once in index.js; keeps the entry point clean.
 */

const helmet        = require("helmet");
const rateLimit     = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp           = require("hpp");

// ─── 1. Helmet — Secure HTTP headers ─────────────────────────────────────────
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "https:", "blob:"],
      connectSrc:  ["'self'"],
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

// ─── 3. Rate limiters ─────────────────────────────────────────────────────────
const defaultLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             2000,           // 2000 requests per 15 min window
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, message: "Too many requests. Please try again in 15 minutes." },
  skip: (req) => process.env.NODE_ENV !== "production" || process.env.NODE_ENV === "test",
});

const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             100,            // 100 auth attempts per window
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, message: "Too many login attempts. Please wait 15 minutes before trying again." },
  skip: (req) => process.env.NODE_ENV !== "production" || process.env.NODE_ENV === "test",
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      100,             // max 100 file uploads per hour per IP
  message:  { success: false, message: "Upload limit reached. Please try again in an hour." },
  skip: (req) => process.env.NODE_ENV !== "production" || process.env.NODE_ENV === "test",
});

// ─── 4. MongoDB Operator Injection Sanitizer ──────────────────────────────────
// Strips characters like $ and . from req.body, req.params, req.query
const mongoSanitizer = mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    console.warn(`[SECURITY] Mongo injection attempt sanitized. Key: ${key} | IP: ${req.ip}`);
  },
});

// ─── 5. HPP — HTTP Parameter Pollution Prevention ────────────────────────────
// Prevents duplicate query string params (e.g. ?sort=asc&sort=malicious)
// Whitelist fields that legitimately support multiple values
const hppMiddleware = hpp({
  whitelist: ["status", "category", "priority"],
});

// ─── 6. Input sanitizer — strips HTML tags from string fields ─────────────────
// A lightweight custom sanitizer; avoids the deprecated xss-clean package.
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === "string") {
        // Remove script tags, on* attributes, and other dangerous HTML
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
