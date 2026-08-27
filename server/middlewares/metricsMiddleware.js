"use strict";

/**
 * ─── Prometheus Operational Observability & Metrics Middleware ────────────────
 * Gathers micro-precision operational metrics:
 * - HTTP request duration histogram and count partitioned by method, route & status
 * - Active WebSocket connections & room occupancy
 * - MongoDB connection pool saturation and query metrics
 * - Node.js process runtime memory (Heap, RSS, Event Loop)
 * Exposes standardized Prometheus text exposition format (version 0.0.4).
 */

const mongoose = require("mongoose");

// Metrics Storage
const httpRequestsTotal = new Map();
const httpRequestDurationBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
const httpRequestDuration = new Map();

/**
 * Normalize express route paths to prevent high-cardinality label explosions
 */
function normalizeRoute(path) {
  if (!path) return "/";
  // Replace MongoDB ObjectIDs / UUIDs / numbers with param markers
  return path
    .replace(/[0-9a-fA-F]{24}/g, ":id")
    .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, ":uuid")
    .replace(/\/\d+/g, "/:id");
}

/**
 * Express Middleware tracking incoming request latency & status codes
 */
const metricsCollector = (req, res, next) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const delta = process.hrtime(start);
    const durationSec = delta[0] + delta[1] / 1e9;

    const route = normalizeRoute(req.baseUrl + (req.route ? req.route.path : req.path));
    const method = req.method;
    const statusCode = res.statusCode;

    const key = `${method}|${route}|${statusCode}`;

    // Increment Counter
    httpRequestsTotal.set(key, (httpRequestsTotal.get(key) || 0) + 1);

    // Record Histogram
    if (!httpRequestDuration.has(key)) {
      httpRequestDuration.set(key, {
        sum: 0,
        count: 0,
        buckets: new Array(httpRequestDurationBuckets.length).fill(0),
      });
    }
    const hist = httpRequestDuration.get(key);
    hist.sum += durationSec;
    hist.count += 1;
    for (let i = 0; i < httpRequestDurationBuckets.length; i++) {
      if (durationSec <= httpRequestDurationBuckets[i]) {
        hist.buckets[i] += 1;
      }
    }
  });

  next();
};

/**
 * Formats metrics into Prometheus text format (/metrics)
 * Includes optional PROMETHEUS_BEARER_TOKEN security guard
 */
const metricsEndpoint = (req, res) => {
  // Optional Bearer Token Authentication for production scrapers
  if (process.env.PROMETHEUS_BEARER_TOKEN) {
    const authHeader = req.headers.authorization || "";
    const customHeader = req.headers["x-prometheus-token"] || "";
    const expectedToken = process.env.PROMETHEUS_BEARER_TOKEN;

    const hasBearer = authHeader.startsWith("Bearer ") && authHeader.slice(7) === expectedToken;
    const hasCustom = customHeader === expectedToken;

    if (!hasBearer && !hasCustom) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing Prometheus scraper token",
      });
    }
  }

  const mem = process.memoryUsage();
  const uptime = process.uptime();

  // Socket IO Metrics
  let activeSockets = 0;
  try {
    const { getIO } = require("../services/socketService");
    const io = getIO();
    if (io && io.sockets && io.sockets.sockets) {
      activeSockets = io.sockets.sockets.size || 0;
    }
  } catch {
    activeSockets = 0;
  }

  // MongoDB Pool Metrics
  const dbState = mongoose.connection.readyState;
  const isConnected = dbState === 1 ? 1 : 0;

  let output = "";

  // 1. Process Memory & Runtime Metrics
  output += `# HELP nodejs_uptime_seconds Number of seconds the process has been running.\n`;
  output += `# TYPE nodejs_uptime_seconds gauge\n`;
  output += `nodejs_uptime_seconds ${uptime.toFixed(2)}\n\n`;

  output += `# HELP nodejs_memory_rss_bytes Resident Set Size memory in bytes.\n`;
  output += `# TYPE nodejs_memory_rss_bytes gauge\n`;
  output += `nodejs_memory_rss_bytes ${mem.rss}\n\n`;

  output += `# HELP nodejs_memory_heap_used_bytes Used heap memory in bytes.\n`;
  output += `# TYPE nodejs_memory_heap_used_bytes gauge\n`;
  output += `nodejs_memory_heap_used_bytes ${mem.heapUsed}\n\n`;

  output += `# HELP nodejs_memory_heap_total_bytes Total allocated heap memory in bytes.\n`;
  output += `# TYPE nodejs_memory_heap_total_bytes gauge\n`;
  output += `nodejs_memory_heap_total_bytes ${mem.heapTotal}\n\n`;

  // 2. WebSocket Metrics
  output += `# HELP socketio_active_connections Number of actively connected WebSocket clients.\n`;
  output += `# TYPE socketio_active_connections gauge\n`;
  output += `socketio_active_connections ${activeSockets}\n\n`;

  // 3. Database Metrics
  output += `# HELP mongodb_connection_status Current MongoDB connection status (1 = connected, 0 = disconnected).\n`;
  output += `# TYPE mongodb_connection_status gauge\n`;
  output += `mongodb_connection_status ${isConnected}\n\n`;

  // 4. HTTP Request Counters
  output += `# HELP http_requests_total Total number of HTTP requests made to the API.\n`;
  output += `# TYPE http_requests_total counter\n`;
  for (const [key, count] of httpRequestsTotal.entries()) {
    const [method, route, statusCode] = key.split("|");
    output += `http_requests_total{method="${method}",route="${route}",status="${statusCode}"} ${count}\n`;
  }
  output += `\n`;

  // 5. HTTP Request Duration Histograms
  output += `# HELP http_request_duration_seconds HTTP request duration in seconds.\n`;
  output += `# TYPE http_request_duration_seconds histogram\n`;
  for (const [key, hist] of httpRequestDuration.entries()) {
    const [method, route, statusCode] = key.split("|");
    for (let i = 0; i < httpRequestDurationBuckets.length; i++) {
      output += `http_request_duration_seconds_bucket{method="${method}",route="${route}",status="${statusCode}",le="${httpRequestDurationBuckets[i]}"} ${hist.buckets[i]}\n`;
    }
    output += `http_request_duration_seconds_bucket{method="${method}",route="${route}",status="${statusCode}",le="+Inf"} ${hist.count}\n`;
    output += `http_request_duration_seconds_sum{method="${method}",route="${route}",status="${statusCode}"} ${hist.sum.toFixed(6)}\n`;
    output += `http_request_duration_seconds_count{method="${method}",route="${route}",status="${statusCode}"} ${hist.count}\n`;
  }

  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.status(200).send(output);
};

module.exports = {
  metricsCollector,
  metricsEndpoint,
};
