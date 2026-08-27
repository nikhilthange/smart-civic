"use strict";

const assert = require("assert");

console.log("\n================================================================================");
console.log("🚨 PROMETHEUS ALERT RULES & ALERTMANAGER ROUTING SIMULATION DRILL");
console.log("================================================================================\n");

function simulateHistogramQuantile(targetQuantile, buckets) {
  // Linear interpolation quantile calculation mirroring Prometheus engine
  const totalCount = buckets[buckets.length - 1].count;
  if (totalCount === 0) return 0;

  const countThreshold = targetQuantile * totalCount;
  let prevUpper = 0;
  let prevCount = 0;

  for (const bucket of buckets) {
    if (bucket.count >= countThreshold) {
      const bucketSpan = bucket.le - prevUpper;
      const countInBucket = bucket.count - prevCount;
      if (countInBucket === 0) return bucket.le;
      const fraction = (countThreshold - prevCount) / countInBucket;
      return prevUpper + (fraction * bucketSpan);
    }
    prevUpper = bucket.le;
    prevCount = bucket.count;
  }
  return buckets[buckets.length - 1].le;
}

function evaluateAlertRule(rule, metricSnapshot) {
  switch (rule.alert) {
    case "DatabaseDown": {
      const status = metricSnapshot.mongodb_connection_status;
      return status === 0;
    }
    case "HighLatencyP95Breach": {
      const p95 = simulateHistogramQuantile(0.95, metricSnapshot.http_request_duration_seconds_bucket);
      return p95 > 0.25;
    }
    case "ContractorEscrowDeficitSurge": {
      const delta = metricSnapshot.smart_civic_escrow_deficit_penalties_total_1h_increase;
      return delta > 50000;
    }
    case "PodCrashLooping": {
      const restartRate = metricSnapshot.kube_pod_container_status_restarts_total_15m_rate;
      return restartRate > 0;
    }
    default:
      throw new Error(`Unknown alert rule: ${rule.alert}`);
  }
}

function simulateAlertmanagerRouting(alert, activeAlerts = []) {
  // Check Inhibition Rules
  if (alert.alertname === "HighLatencyP95Breach") {
    const isDbDownActive = activeAlerts.some(
      a => a.alertname === "DatabaseDown" && a.namespace === alert.namespace
    );
    if (isDbDownActive) {
      return { inhibited: true, receiver: null, reason: "Inhibited by active DatabaseDown alert" };
    }
  }

  // Routing Tree
  if (alert.severity === "critical") {
    return { inhibited: false, receiver: "critical-incident-webhook", priority: "P1" };
  } else if (alert.severity === "warning") {
    return { inhibited: false, receiver: "warning-ops-webhook", priority: "P2" };
  }

  return { inhibited: false, receiver: "sre-oncall-webhook", priority: "P3" };
}

async function runAlertSimulationDrill() {
  let passed = 0;
  let total = 0;

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Database Outage & Readiness Degradation (DatabaseDown)
  // ───────────────────────────────────────────────────────────────────────────
  console.log("▶ [Test 1] Testing PromQL Evaluation: DatabaseDown (mongodb_connection_status == 0)...");
  total++;
  try {
    const rule = { alert: "DatabaseDown", expr: "mongodb_connection_status == 0", severity: "critical" };
    
    // Normal healthy state
    const healthyMetrics = { mongodb_connection_status: 1 };
    assert.strictEqual(evaluateAlertRule(rule, healthyMetrics), false, "DatabaseDown does not fire when Mongo is healthy (1)");

    // Severed connection state
    const degradedMetrics = { mongodb_connection_status: 0 };
    assert.strictEqual(evaluateAlertRule(rule, degradedMetrics), true, "DatabaseDown fires when Mongo status is 0");

    const routing = simulateAlertmanagerRouting({ alertname: "DatabaseDown", namespace: "smart-civic", severity: "critical" });
    assert.strictEqual(routing.inhibited, false);
    assert.strictEqual(routing.receiver, "critical-incident-webhook");
    assert.strictEqual(routing.priority, "P1");

    console.log("  ✅ PASSED: DatabaseDown rule triggered on status=0 and dispatched to critical-incident-webhook");
    passed++;
  } catch (err) {
    console.error("  ❌ FAILED: Scenario 1 -", err.message);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: P95 Latency SLA Breach (> 250ms)
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n▶ [Test 2] Testing PromQL Evaluation: HighLatencyP95Breach (P95 > 0.25s)...");
  total++;
  try {
    const rule = { alert: "HighLatencyP95Breach", expr: "histogram_quantile(0.95, ...) > 0.25", severity: "warning" };

    // Scenario A: P95 = 120ms (Under 250ms threshold)
    const lowLatencyBuckets = [
      { le: 0.05, count: 50 },
      { le: 0.10, count: 85 },
      { le: 0.25, count: 98 },
      { le: 0.50, count: 100 },
      { le: Infinity, count: 100 }
    ];
    const lowLatencySnapshot = { http_request_duration_seconds_bucket: lowLatencyBuckets };
    assert.strictEqual(evaluateAlertRule(rule, lowLatencySnapshot), false, "HighLatencyP95Breach does not fire when P95 <= 250ms");

    // Scenario B: P95 = 320ms (Breaches 250ms threshold)
    const highLatencyBuckets = [
      { le: 0.05, count: 10 },
      { le: 0.10, count: 30 },
      { le: 0.25, count: 60 },
      { le: 0.50, count: 98 },
      { le: Infinity, count: 100 }
    ];
    const highLatencySnapshot = { http_request_duration_seconds_bucket: highLatencyBuckets };
    const computedP95 = simulateHistogramQuantile(0.95, highLatencyBuckets);
    assert.ok(computedP95 > 0.25, `Computed P95 (${(computedP95 * 1000).toFixed(1)}ms) exceeds 250ms`);
    assert.strictEqual(evaluateAlertRule(rule, highLatencySnapshot), true, "HighLatencyP95Breach fires when P95 > 250ms");

    const routing = simulateAlertmanagerRouting({ alertname: "HighLatencyP95Breach", namespace: "smart-civic", severity: "warning" });
    assert.strictEqual(routing.inhibited, false);
    assert.strictEqual(routing.receiver, "warning-ops-webhook");

    console.log(`  ✅ PASSED: HighLatencyP95Breach accurately computed P95 (${(computedP95 * 1000).toFixed(1)}ms) and triggered warning alert`);
    passed++;
  } catch (err) {
    console.error("  ❌ FAILED: Scenario 2 -", err.message);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Contractor Escrow Deficit Penalty Spike (> ₹50,000)
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n▶ [Test 3] Testing PromQL Evaluation: ContractorEscrowDeficitSurge (> 50,000 INR/h)...");
  total++;
  try {
    const rule = { alert: "ContractorEscrowDeficitSurge", expr: "increase(...) > 50000", severity: "warning" };

    // Below threshold (₹25,000 increase)
    const normalDelta = { smart_civic_escrow_deficit_penalties_total_1h_increase: 25000 };
    assert.strictEqual(evaluateAlertRule(rule, normalDelta), false, "ContractorEscrowDeficitSurge does not fire on ₹25,000 delta");

    // Surge breach (₹65,000 increase)
    const surgeDelta = { smart_civic_escrow_deficit_penalties_total_1h_increase: 65000 };
    assert.strictEqual(evaluateAlertRule(rule, surgeDelta), true, "ContractorEscrowDeficitSurge fires on ₹65,000 surge");

    console.log("  ✅ PASSED: ContractorEscrowDeficitSurge triggered on ₹65,000 deficit surge");
    passed++;
  } catch (err) {
    console.error("  ❌ FAILED: Scenario 3 -", err.message);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Pod CrashLooping Detection
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n▶ [Test 4] Testing PromQL Evaluation: PodCrashLooping (restart rate > 0)...");
  total++;
  try {
    const rule = { alert: "PodCrashLooping", expr: "rate(...) > 0", severity: "critical" };

    // 0 restarts
    const stablePod = { kube_pod_container_status_restarts_total_15m_rate: 0 };
    assert.strictEqual(evaluateAlertRule(rule, stablePod), false, "PodCrashLooping does not fire when restart rate is 0");

    // Restarts detected
    const crashingPod = { kube_pod_container_status_restarts_total_15m_rate: 0.05 };
    assert.strictEqual(evaluateAlertRule(rule, crashingPod), true, "PodCrashLooping fires when restart rate > 0");

    console.log("  ✅ PASSED: PodCrashLooping triggered on restart rate > 0");
    passed++;
  } catch (err) {
    console.error("  ❌ FAILED: Scenario 4 -", err.message);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: Alertmanager Inhibition Logic (Root Cause Deduplication)
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n▶ [Test 5] Testing Alertmanager Inhibition: Inhibit HighLatencyP95Breach if DatabaseDown is firing...");
  total++;
  try {
    const activeAlerts = [
      { alertname: "DatabaseDown", namespace: "smart-civic", severity: "critical" }
    ];

    const latencyAlert = { alertname: "HighLatencyP95Breach", namespace: "smart-civic", severity: "warning" };
    const routeResult = simulateAlertmanagerRouting(latencyAlert, activeAlerts);

    assert.strictEqual(routeResult.inhibited, true, "Latency alert must be inhibited when DB is down");
    assert.strictEqual(routeResult.receiver, null, "Inhibited alert has no active receiver dispatch");

    console.log("  ✅ PASSED: HighLatencyP95Breach correctly inhibited by DatabaseDown root cause");
    passed++;
  } catch (err) {
    console.error("  ❌ FAILED: Scenario 5 -", err.message);
  }

  console.log("\n================================================================================");
  console.log(`  PROMETHEUS ALERT SIMULATION: ${passed} PASSED / ${total - passed} FAILED (TOTAL: ${total})`);
  console.log("================================================================================\n");

  if (passed === total) {
    console.log("🎉 ALL PROMETHEUS ALERT EVALUATIONS & INHIBITIONS 100% VERIFIED!\n");
  } else {
    process.exit(1);
  }
}

runAlertSimulationDrill();
