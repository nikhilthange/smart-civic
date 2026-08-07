/**
 * ─── Smart Civic API — Entry Point ───────────────────────────────────────────
 * Production-ready Express server with full security hardening.
 */

"use strict";

const express    = require("express");
const dotenv     = require("dotenv");
const cors       = require("cors");
const path       = require("path");
const morgan     = require("morgan");

// ─── Load env vars FIRST ──────────────────────────────────────────────────────
dotenv.config();

// ─── DB ───────────────────────────────────────────────────────────────────────
const connectDB = require("./config/db");
connectDB();

// ─── Security middleware ──────────────────────────────────────────────────────
const {
  helmetMiddleware,
  corsOptions,
  defaultLimiter,
  authLimiter,
  uploadLimiter,
  mongoSanitizer,
  hppMiddleware,
  sanitizeInput,
} = require("./middlewares/security");

// ─── Error handling ───────────────────────────────────────────────────────────
const { globalErrorHandler, notFoundHandler } = require("./middlewares/errorHandler");

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

// ─── Trust proxy (needed when behind Nginx / Heroku / Railway etc.) ──────────
app.set("trust proxy", 1);

// ═══════════════════════════════════════════════════════════════════════════════
//  SECURITY MIDDLEWARE STACK (order matters!)
// ═══════════════════════════════════════════════════════════════════════════════

// 1. Secure HTTP headers via Helmet
app.use(helmetMiddleware);

// 2. CORS — before any routes
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // handle preflight for all routes

// 3. Apply global rate limiter to all API routes
app.use("/api", defaultLimiter);

// 4. Body parsers — keep limits tight
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// 5. Data sanitization — strip MongoDB operators ($, .) from user input
app.use(mongoSanitizer);

// 6. Custom HTML/script sanitizer
app.use(sanitizeInput);

// 7. HTTP Parameter Pollution prevention
app.use(hppMiddleware);

// 8. Request logger (skip in test environment)
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
  );
}

// ─── Static uploads ───────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ═══════════════════════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Auth routes get stricter rate limit (brute-force protection)
app.use("/api/auth",          authLimiter, require("./routes/authRoutes"));

// Complaint creation has upload limiter
app.use("/api/complaints",    require("./routes/complaintRoutes"));

app.use("/api/feedback",      require("./routes/feedbackRoutes"));
app.use("/api/departments",   require("./routes/departmentRoutes"));
app.use("/api/officers",      require("./routes/officerRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/payments",      require("./routes/paymentRoutes"));
app.use("/api/donations",     require("./routes/donationRoutes"));
app.use("/api/analytics",     require("./routes/analyticsRoutes"));

// ─── Health check (no rate limit — used by load balancers) ────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Civic API is running",
    env:     process.env.NODE_ENV,
    uptime:  Math.floor(process.uptime()) + "s",
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  ERROR HANDLING (must be LAST)
// ═══════════════════════════════════════════════════════════════════════════════
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});

// ─── Graceful shutdown — close DB + pending connections ───────────────────────
const shutdown = (signal) => {
  console.log(`\n⚠️  ${signal} received. Gracefully shutting down...`);
  server.close(() => {
    console.log("✅ HTTP server closed.");
    process.exit(0);
  });
  // Force-kill if shutdown hangs beyond 10s
  setTimeout(() => {
    console.error("❌ Forced shutdown due to timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

// ─── Unhandled rejections / exceptions ───────────────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection:", reason);
  // In production, shut down to let process manager restart cleanly
  if (process.env.NODE_ENV === "production") shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  shutdown("uncaughtException");
});

module.exports = app; // for testing
