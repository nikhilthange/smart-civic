"use strict";

/**
 * ─── OpenTelemetry (OTel) Distributed APM Tracing Verification Suite ───────────
 * Tests W3C TraceContext generation, HTTP header propagation, and Async Worker span linking.
 */

const assert = require("assert");
const { tracer, OpenTelemetryTracer } = require("../tracing");
const queueService = require("../services/queueService");

console.log("\n================================================================================");
console.log("🔭 OPENTELEMETRY (OTEL) DISTRIBUTED APM TRACING VERIFICATION DRILL");
console.log("================================================================================\n");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  process.stdout.write(`▶ [Test ${total}] ${name}...`);
  try {
    fn();
    console.log("  ✅ PASSED");
    passed++;
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    process.exitCode = 1;
  }
}

async function runAsyncTest(name, fn) {
  total++;
  process.stdout.write(`▶ [Test ${total}] ${name}...`);
  try {
    await fn();
    console.log("  ✅ PASSED");
    passed++;
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    process.exitCode = 1;
  }
}

async function runSuite() {
  // Test 1: W3C TraceContext Formatting
  runTest("W3C TraceContext 128-bit TraceId and 64-bit SpanId format validation", () => {
    const traceId = tracer.generateTraceId();
    const spanId = tracer.generateSpanId();
    assert.strictEqual(traceId.length, 32, "Trace ID must be 32 hex characters (128 bits)");
    assert.strictEqual(spanId.length, 16, "Span ID must be 16 hex characters (64 bits)");

    const traceparent = tracer.formatTraceparent(traceId, spanId, true);
    assert.match(traceparent, /^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/, "Traceparent must strictly conform to W3C spec");
  });

  // Test 2: Span Hierarchy and Attributes
  runTest("Server Span creation, Parent Context extraction & Status lifecycle", () => {
    const parentSpan = tracer.startSpan("HTTP POST /api/complaints", {
      kind: "SERVER",
      attributes: { "http.method": "POST", "http.route": "/api/complaints" },
    });

    assert.strictEqual(parentSpan.status.code, "UNSET");
    assert.strictEqual(parentSpan.attributes["http.method"], "POST");

    const childSpan = tracer.startSpan("DB findOne complaints", {
      parentContext: { traceContext: { traceId: parentSpan.traceId, spanId: parentSpan.spanId } },
      kind: "CLIENT",
    });

    assert.strictEqual(childSpan.traceId, parentSpan.traceId, "Child span must inherit parent traceId");
    assert.strictEqual(childSpan.parentSpanId, parentSpan.spanId, "Child span parentSpanId must match parent spanId");

    childSpan.end({ code: "OK" });
    parentSpan.end({ code: "OK" });

    assert.strictEqual(childSpan.status.code, "OK");
    assert.ok(childSpan.durationMs >= 0, "Span must record non-negative execution duration");
  });

  // Test 3: Express Middleware Context Injection
  runTest("Express Middleware trace context header injection", () => {
    const middleware = tracer.middleware();
    const req = {
      method: "GET",
      url: "/api/complaints/BMC-2026-001",
      path: "/api/complaints/BMC-2026-001",
      headers: { host: "smart-civic.mumbai.gov.in" },
    };
    const headersSent = {};
    const res = {
      statusCode: 200,
      setHeader: (key, val) => { headersSent[key.toLowerCase()] = val; },
      on: () => {},
    };

    middleware(req, res, () => {});

    assert.ok(req.traceContext, "Middleware must attach req.traceContext");
    assert.ok(headersSent["x-trace-id"], "Middleware must set x-trace-id header");
    assert.ok(headersSent["traceparent"], "Middleware must set W3C traceparent header");
    assert.strictEqual(headersSent["x-trace-id"], req.traceContext.traceId);
  });

  // Test 4: Async Worker Distributed Context Propagation
  await runAsyncTest("Queue Service async worker span linking across Redis boundary", async () => {
    const parentTraceparent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
    const receipt = queueService.enqueueJob("PDF_NOTICE_GENERATION", {
      complaintId: "BMC-2026-OTEL",
      title: "Pothole repair notice",
    }, {
      traceContext: {
        traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
        spanId: "00f067aa0ba902b7",
        traceparent: parentTraceparent,
      },
    });

    assert.ok(receipt.jobId, "Job must be enqueued with unique ID");
    assert.strictEqual(receipt.traceparent, parentTraceparent, "Receipt must retain incoming W3C traceparent");

    // Wait for async processing
    await new Promise((resolve) => setTimeout(resolve, 150));
    const job = queueService.jobs.get(receipt.jobId);
    assert.strictEqual(job.status, "COMPLETED", "Task must complete asynchronously");
    assert.strictEqual(job.traceContext.traceId, "4bf92f3577b34da6a3ce929d0e0e4736", "Worker must retain parent traceId");
  });

  console.log("\n================================================================================");
  console.log(`  OPENTELEMETRY TRACING VERIFICATION: ${passed} PASSED / ${total - passed} FAILED (TOTAL: ${total})`);
  console.log("================================================================================\n");

  if (passed === total) {
    console.log("🎉 OPENTELEMETRY DISTRIBUTED TRACING 100% OPERATIONAL & W3C COMPLIANT!\n");
  } else {
    process.exit(1);
  }
}

runSuite();
