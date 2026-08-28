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

// ─── Production Secret Environment Guard ───────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const weakDefaults = ["secret", "secret123", "default_secret", "development_fallback", "change_me", "123456"];
  const jwt = process.env.JWT_SECRET;
  const mongo = process.env.MONGO_URI || process.env.MONGODB_URI;

  const errors = [];
  if (!jwt || weakDefaults.includes(jwt.toLowerCase())) {
    errors.push("JWT_SECRET is missing or using an insecure fallback value");
  }
  if (!mongo || weakDefaults.includes(mongo.toLowerCase())) {
    errors.push("MONGO_URI is missing or using an insecure fallback value");
  }

  if (errors.length > 0) {
    console.error("🚨 CRITICAL PRODUCTION CONFIGURATION ERROR:\n" + errors.map((e) => `  - ${e}`).join("\n"));
    process.exit(1);
  }
}

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

// ─── Metrics & Observability ──────────────────────────────────────────────────
const { metricsCollector, metricsEndpoint } = require("./middlewares/metricsMiddleware");
const { tracer } = require("./tracing");

// ─── Error handling ───────────────────────────────────────────────────────────
const { globalErrorHandler, notFoundHandler } = require("./middlewares/errorHandler");

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

// ─── Distributed Tracing & Metrics Middleware ────────────────────────────────
app.use(tracer.middleware());
app.use(metricsCollector);

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

// 4. Body parsers — keep limits tight to prevent heap exhaustion
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// 5. Data sanitization — strip MongoDB operators ($, .) from user input
app.use(mongoSanitizer);

// 6. Custom HTML/script sanitizer
app.use(sanitizeInput);

// 7. HTTP Parameter Pollution prevention
app.use(hppMiddleware);

// 8. High-Performance Gzip/Brotli Response Compression (Threshold > 1KB)
const compression = require("compression");
app.use(
  compression({
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  })
);

// 9. Request logger (skip in test environment)
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
  );
}

// ─── Static uploads with Caching Headers ─────────────────────────────────────
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
    next();
  },
  express.static(path.join(__dirname, "uploads"), { maxAge: "1d" })
);

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
app.use("/api/reports",       require("./routes/reportRoutes"));
app.use("/api/admin",         require("./routes/adminRoutes"));
app.use("/api/webhooks",      require("./routes/webhookRoutes"));
app.use("/api/iot",           require("./routes/iotRoutes"));
app.use("/api/monsoon",       require("./routes/monsoonRoutes"));
app.use("/api/dlp",           require("./routes/dlpRoutes"));
app.use("/api/swm",           require("./routes/swmFleetRoutes"));
app.use("/api/encroachment",  require("./routes/encroachmentRoutes"));
app.use("/api/ward-budget",   require("./routes/wardBudgetRoutes"));
app.use("/api/trenching",     require("./routes/trenchingRoutes"));
app.use("/api/aqi",           require("./routes/aqiRoutes"));
app.use("/api/water",         require("./routes/waterRoutes"));
app.use("/api/vector",        require("./routes/vectorRoutes"));
app.use("/api/turf",          require("./routes/turfRoutes"));
app.use("/api/disaster",      require("./routes/disasterRoutes"));
app.use("/api/structural",    require("./routes/structuralHealthRoutes"));
app.use("/api/coastal",       require("./routes/coastalSentinelRoutes"));
app.use("/api/fire-safety",   require("./routes/fireSafetyRoutes"));
app.use("/api/tax-audit",     require("./routes/taxAuditRoutes"));
app.use("/api/transit-lane",  require("./routes/transitLaneRoutes"));
app.use("/api/animal-welfare", require("./routes/animalWelfareRoutes"));
app.use("/api/audit",         require("./routes/auditRoutes"));
app.use("/api/copilot",       require("./routes/copilotRoutes"));
app.use("/api/cctv",          require("./routes/cctvRoutes"));
app.use("/api/notices",       require("./routes/noticeRoutes"));
app.use("/api/green-bonds",   require("./routes/greenBondRoutes"));
app.use("/api/appeals",       require("./routes/appealRoutes"));
app.use("/api/social",        require("./routes/socialRoutes"));
app.use("/api/karma",         require("./routes/civicKarmaRoutes"));
app.use("/api/contractors",   require("./routes/contractorRoutes"));
app.use("/api/alm",           require("./routes/almRoutes"));
app.use("/api/worker",        require("./routes/workerRoutes"));
app.use("/api/sitrep",        require("./routes/sitrepRoutes"));
app.use("/api/broadcast",     require("./routes/broadcastRoutes"));
app.use("/api/simulator",     require("./routes/simulationRoutes"));

// ─── Health check & Root Endpoints (Supports both GET and HEAD for Uptime Probes) ──
const mongoose = require("mongoose");

const rootTelemetryHandler = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: "ok",
    service: "Smart Civic AI Platform Backend",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: isDbConnected ? "connected" : "disconnected",
  });
};

const fullHealthHandler = (req, res) => {
  const mem = process.memoryUsage();
  const isDbConnected = mongoose.connection.readyState === 1;
  const statusCode = isDbConnected ? 200 : 503;

  res.status(statusCode).json({
    success: isDbConnected,
    status: isDbConnected ? "HEALTHY" : "DEGRADED",
    service: "Smart Civic AI Platform API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: {
      status: isDbConnected ? "CONNECTED" : "DISCONNECTED",
      host: mongoose.connection.host || "localhost",
      name: mongoose.connection.name || "smart-civic",
    },
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    },
  });
};

// Root and uptime probe routes (Handles both GET and HEAD cleanly)
app.all(["/", "/live", "/api/live", "/ping", "/api/ping"], (req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD") {
    return rootTelemetryHandler(req, res);
  }
  next();
});

app.all(["/health", "/api/health"], (req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD") {
    return fullHealthHandler(req, res);
  }
  next();
});

app.get("/metrics", metricsEndpoint);
app.get("/api/metrics", metricsEndpoint);

// ═══════════════════════════════════════════════════════════════════════════════
//  ERROR HANDLING (must be LAST)
// ═══════════════════════════════════════════════════════════════════════════════
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  
  // ─── Initialize Native WebSocket Gateway ────────────────────────────────────
  const { initSocket } = require("./services/socketService");
  initSocket(server);
  console.log("🔌 Native WebSocket Gateway initialized on HTTP server.");

  // ─── Initialize SLA Background Worker ──────────────────────────────────────
  const slaService = require("./services/slaService");
  setTimeout(() => slaService.checkSlaBreaches(), 5000);
  setInterval(() => slaService.checkSlaBreaches(), 10 * 60 * 1000);
});

// ─── Graceful shutdown — close DB + pending connections ───────────────────────
const shutdown = async (signal) => {
  console.log(`\n⚠️  ${signal} received. Gracefully shutting down...`);
  
  // Force-kill if shutdown hangs beyond 10s
  const forceKillTimeout = setTimeout(() => {
    console.error("❌ Forced process exit after shutdown timeout.");
    process.exit(1);
  }, 10000);

  try {
    // 1. Close active WebSocket connections
    try {
      const { getIO } = require("./services/socketService");
      const io = getIO();
      if (io) {
        io.close();
        console.log("✅ WebSocket Gateway connections drained and closed.");
      }
    } catch (wsCloseErr) {
      console.warn("WebSocket shutdown notice:", wsCloseErr.message);
    }

    // 2. Close HTTP Server & drain in-flight traffic
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log("✅ HTTP server closed. In-flight connections drained.");
    }

    // 3. Drain Database Pool
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      console.log("✅ MongoDB connection closed cleanly.");
    }

    clearTimeout(forceKillTimeout);
    process.exit(signal === "uncaughtException" ? 1 : 0);
  } catch (err) {
    console.error("Shutdown error:", err.message);
    clearTimeout(forceKillTimeout);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

// ─── Unhandled rejections / exceptions ───────────────────────────────────────
process.on("unhandledRejection", (reason, _promise) => {
  console.error("💥 Unhandled Rejection:", JSON.stringify({ reason: reason?.message || String(reason) }));
  if (process.env.NODE_ENV === "production") shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", JSON.stringify({ error: err.message, stack: err.stack }));
  shutdown("uncaughtException");
});

module.exports = app; // for testing
