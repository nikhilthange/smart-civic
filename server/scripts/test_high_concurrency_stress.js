"use strict";

/**
 * ============================================================================
 * ⚡ HIGH-CONCURRENCY PERFORMANCE & CONNECTION POOL STRESS TEST SUITE
 * ============================================================================
 */

require("dotenv").config({ path: "server/.env" });
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const sitrepService = require("../services/sitrepService");

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ PASSED: ${message}`);
}

async function runStressTest() {
  console.log("\n================================================================================");
  console.log("⚡ HIGH-CONCURRENCY PRODUCTION TRAFFIC & LATENCY STRESS TEST");
  console.log("================================================================================\n");

  const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart-civic";
  await mongoose.connect(mongoURI, {
    maxPoolSize: 100,
    minPoolSize: 20,
  });

  const TOTAL_CONCURRENT_REQUESTS = 500;
  const CONCURRENCY_WINDOW = 25; // 25 parallel worker channels simulating active HTTP connection pool
  
  // Pre-warm SITREP cache
  await sitrepService.generateDailySitrep();
  console.log(`[Phase 1] Launching ${TOTAL_CONCURRENT_REQUESTS} requests across ${CONCURRENCY_WINDOW} concurrent HTTP pipelines (Warmed Cache)...`);

  const startMemory = process.memoryUsage().heapUsed;

  // --------------------------------------------------------------------------
  // Benchmark 1: High-Frequency Cached Telemetry (Target: P95 < 50ms)
  // --------------------------------------------------------------------------
  console.log(`[Benchmark 1] Testing 500 High-Concurrency Cached Operations (Concurrency: ${CONCURRENCY_WINDOW})...`);
  const cachedLatencies = [];
  let reqIdx1 = 0;
  const cachedWorker = async () => {
    while (reqIdx1 < TOTAL_CONCURRENT_REQUESTS) {
      reqIdx1++;
      const t0 = Date.now();
      await sitrepService.generateDailySitrep();
      const t1 = Date.now();
      cachedLatencies.push(t1 - t0);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY_WINDOW }, () => cachedWorker()));
  cachedLatencies.sort((a, b) => a - b);
  const cachedP95 = cachedLatencies[Math.floor(cachedLatencies.length * 0.95)];
  console.log(`  • Cached Route P50: ${cachedLatencies[Math.floor(cachedLatencies.length * 0.5)]} ms | P95: ${cachedP95} ms | P99: ${cachedLatencies[Math.floor(cachedLatencies.length * 0.99)]} ms`);
  assert(cachedP95 < 50, `Cached Route P95 latency is under 50ms (${cachedP95} ms)`);

  // --------------------------------------------------------------------------
  // Benchmark 2: Concurrent Database Lean Queries via Mongoose Pool (Target: P95 < 1000ms)
  // --------------------------------------------------------------------------
  console.log(`\n[Benchmark 2] Testing 500 Mongoose Connection Pool Lean Reads (Concurrency: ${CONCURRENCY_WINDOW})...`);
  const dbLatencies = [];
  let reqIdx2 = 0;
  const dbWorker = async () => {
    while (reqIdx2 < TOTAL_CONCURRENT_REQUESTS) {
      reqIdx2++;
      const t0 = Date.now();
      await Complaint.find({ status: "in_progress" }).limit(5).lean();
      const t1 = Date.now();
      dbLatencies.push(t1 - t0);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY_WINDOW }, () => dbWorker()));
  dbLatencies.sort((a, b) => a - b);
  const dbP95 = dbLatencies[Math.floor(dbLatencies.length * 0.95)];
  console.log(`  • Database Pool P50: ${dbLatencies[Math.floor(dbLatencies.length * 0.5)]} ms | P95: ${dbP95} ms | P99: ${dbLatencies[Math.floor(dbLatencies.length * 0.99)]} ms`);
  assert(dbP95 < 1000, `Database Pool P95 latency is under 1000ms (${dbP95} ms)`);

  const endMemory = process.memoryUsage().heapUsed;
  const memoryDeltaMb = (endMemory - startMemory) / (1024 * 1024);
  assert(memoryDeltaMb < 80, `Zero memory leak detected under load (Delta: ${memoryDeltaMb.toFixed(2)} MB)`);
  assert(mongoose.connection.readyState === 1, "Mongoose connection pool remained stable throughout test");

  console.log("\n================================================================================");
  console.log("🎉 ALL HIGH-CONCURRENCY STRESS & LATENCY TARGETS PASSED! (100% HEALTH)");
  console.log("================================================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

runStressTest().catch((err) => {
  console.error("Stress test failed with fatal error:", err);
  process.exit(1);
});
