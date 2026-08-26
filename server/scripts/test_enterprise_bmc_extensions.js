"use strict";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  SMART CIVIC: 6 ENTERPRISE MUNICIPAL EXTENSIONS AUTOMATED TEST SUITE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Validates the next 6 Enterprise Municipal Subsystems:
 *  1. Multi-Agency Utility "Dig Once" Trenching & DLP Road Block
 *  2. C&D Dust Mitigation & AQI Barricade Enforcement
 *  3. Non-Revenue Water (NRW) Flow Differential & QR Tanker Tracking
 *  4. Epidemic Vector GIS & Predictive Fogging Routing
 *  5. Nighttime Commercial Turf Noise & Light Pollution Monitor
 *  6. Flooded Subway Underpasses & Dynamic Evacuation Routing
 */

const assert = require("assert");

// Import Services
const { evaluateTrenchingRequest } = require("../services/trenchingService");
const { processAqiTelemetry, verifySiteBarricadeProof } = require("../services/aqiEnforcementService");
const { calculateWaterLossDiscrepancy, generateTankerQrPass, verifyTankerDelivery } = require("../services/waterAuditService");
const { calculateVectorRiskScore, generateFoggingRoute } = require("../services/vectorDiseaseService");
const { auditTurfViolation } = require("../services/noiseMonitorService");
const { evaluateSubwayInundation } = require("../services/evacuationRoutingService");

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function main() {
  console.log("═════════════════════════════════════════════════════════════════════");
  console.log("  BMC SMART CIVIC: 6 ENTERPRISE MUNICIPAL EXTENSIONS TEST RUNNER");
  console.log("═════════════════════════════════════════════════════════════════════\n");

  // ─────────────────────────────────────────────────────────────────────────
  // 1. MULTI-AGENCY UTILITY "DIG ONCE" TRENCHING & DLP ROAD BLOCK
  // ─────────────────────────────────────────────────────────────────────────
  console.log("▶ MODULE 1: MULTI-AGENCY UTILITY 'DIG ONCE' TRENCHING...");

  await runAsyncTest("Approves standard utility trenching when no conflicts exist", async () => {
    const result = await evaluateTrenchingRequest({
      agencyName: "Tata Power Company",
      ward: "Ward G-North",
      roadName: "Senapati Bapat Marg",
      coordinates: [[72.8425, 19.0185], [72.8440, 19.0220]],
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-15"),
      estimatedLengthMeters: 200,
    });
    assert.strictEqual(result.approved, true);
    assert.strictEqual(result.status, "APPROVED");
    assert(result.reinstatementBondRequiredInr > 0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. C&D DUST & AQI BARRICADE ENFORCEMENT
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ MODULE 2: C&D DUST MITIGATION & AQI ENFORCEMENT...");

  await runAsyncTest("Triggers STOP_WORK notice and ₹50,000 penalty when PM10 > 150 µg/m³ for 65 mins", async () => {
    const result = await processAqiTelemetry({
      siteId: "SITE-HW-02",
      pm10: 185,
      pm25: 88,
      exceedanceDurationMinutes: 65,
    });
    assert.strictEqual(result.isPm10Breached, true);
    assert.strictEqual(result.isStopWorkNoticeIssued, true);
    assert.strictEqual(result.penaltyLeviedInr, 50000);
    assert.strictEqual(result.aqiCategory, "POOR_UNHEALTHY");
    assert(result.enforcementNotice.includes("STOP-WORK NOTICE ACTIVE"));
  });

  await runAsyncTest("Keeps status compliant when PM10 is below threshold (90 µg/m³)", async () => {
    const result = await processAqiTelemetry({
      siteId: "SITE-GN-01",
      pm10: 90,
      pm25: 42,
      exceedanceDurationMinutes: 10,
    });
    assert.strictEqual(result.isPm10Breached, false);
    assert.strictEqual(result.isStopWorkNoticeIssued, false);
    assert.strictEqual(result.penaltyLeviedInr, 0);
  });

  runTest("Verifies 35ft fabric barricades, wheel-wash basins, and anti-smog guns", () => {
    const auditPass = verifySiteBarricadeProof({
      has35FtBarricade: true,
      hasWheelWashBasin: true,
      hasAntiSmogGun: true,
    });
    assert.strictEqual(auditPass.isFullyCompliant, true);
    assert.strictEqual(auditPass.complianceScore, 100);

    const auditFail = verifySiteBarricadeProof({
      has35FtBarricade: false,
      hasWheelWashBasin: false,
      hasAntiSmogGun: true,
    });
    assert.strictEqual(auditFail.isFullyCompliant, false);
    assert.strictEqual(auditFail.missingItems.length, 2);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. NON-REVENUE WATER (NRW) AUDIT & QR TANKER TRACKING
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ MODULE 3: NON-REVENUE WATER AUDIT & QR TANKER TRACKING...");

  runTest("Calculates pipeline transmission discrepancy and flags > 18% as CRITICAL_PIPELINE_THEFT_LEAK", () => {
    // Inflow: 48 MLD, Outflow: 36.8 MLD -> Loss: 11.2 MLD (23.33%)
    const audit = calculateWaterLossDiscrepancy(48.0, 36.8);
    assert.strictEqual(audit.lossPercentage, 23.3);
    assert.strictEqual(audit.status, "CRITICAL_PIPELINE_THEFT_LEAK");
    assert.strictEqual(audit.alertSeverity, "RED_EMERGENCY");
  });

  runTest("Generates cryptographically signed HMAC-SHA256 QR tanker trip pass", () => {
    const pass = generateTankerQrPass({
      tankerRegistrationNo: "MH-01-AN-9921",
      driverName: "Suresh Patil",
      capacityLiters: 10000,
      destinationSociety: "Raheja Horizon CHS",
      destinationWard: "Ward H-West",
      maxCappedRateInr: 1800,
    });
    assert(pass.tripPassId.startsWith("WT-"));
    assert(pass.qrSignatureHash.length === 64); // SHA256 hex length
    assert.strictEqual(pass.maxCappedRateInr, 1800);
  });

  runTest("Flags price-gouging penalty when driver charges above BMC statutory cap", () => {
    const verification = verifyTankerDelivery({
      tripPassId: "WT-123456-789",
      qrSignatureHash: "abc123hash",
      reportedPriceChargedInr: 2800,
      maxCappedRateInr: 1800,
    });
    assert.strictEqual(verification.isValid, true);
    assert.strictEqual(verification.status, "PRICE_GOUGING_PENALTY_FLAGGED");
    assert.strictEqual(verification.isPriceCompliant, false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. EPIDEMIC VECTOR GIS & PREDICTIVE FOGGING DISPATCH
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ MODULE 4: EPIDEMIC VECTOR GIS & FOGGING ROUTING...");

  runTest("Calculates weighted Vector Risk Score combining fever cases, larval index, and stagnant water", () => {
    const risk = calculateVectorRiskScore(28, 78, 14);
    assert(risk.riskScore >= 70);
    assert.strictEqual(risk.riskLevel, "CRITICAL_EPIDEMIC_SURGE");
    assert.strictEqual(risk.sprayPriority, "IMMEDIATE_24H_PSD_THERMAL_FOGGING");
  });

  runTest("Generates prioritized TSP circuit for Pest Control Department (PSD) fogging trucks", () => {
    const route = generateFoggingRoute("Ward G-North");
    assert(route.totalWaypoints >= 2);
    assert(route.estimatedCircuitKm > 0);
    assert.strictEqual(route.shiftTarget, "EVENING_TWILIGHT_FOGGING (18:00 - 20:30 IST)");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. NIGHTTIME TURF NOISE & LIGHT POLLUTION MONITOR
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ MODULE 5: NIGHTTIME TURF NOISE & LIGHT POLLUTION...");

  await runAsyncTest("Flags noise curfew breach when 68 dBA is recorded past 22:00 IST", async () => {
    const curfewDate = new Date("2026-08-26T23:30:00+05:30");
    const audit = await auditTurfViolation({
      venueId: "TRF-HW-01",
      decibelsDba: 68,
      luxLevel: 310,
      timestamp: curfewDate,
    });
    assert.strictEqual(audit.isPastCurfew, true);
    assert.strictEqual(audit.isViolation, true);
    assert.strictEqual(audit.operatingLicenseStatus, "SUSPENDED");
    assert.strictEqual(audit.actionTaken, "ESCALATED_TO_SENIOR_POLICE_INSPECTOR_AND_LICENSE_DEPT");
  });

  await runAsyncTest("Allows standard sports play during daytime hours (17:00 IST)", async () => {
    const daytime = new Date("2026-08-26T17:00:00+05:30");
    const audit = await auditTurfViolation({
      venueId: "TRF-GN-02",
      decibelsDba: 62,
      luxLevel: 180,
      timestamp: daytime,
    });
    assert.strictEqual(audit.isPastCurfew, false);
    assert.strictEqual(audit.isViolation, false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. FLOODED SUBWAY UNDERPASS DETOUR & EVACUATION ROUTER
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ MODULE 6: FLOODED SUBWAY UNDERPASS DETOUR ROUTER...");

  runTest("Closes Andheri Subway when water depth >= 30cm and generates flyover detour alert", () => {
    const result = evaluateSubwayInundation("SUB-ANDHERI", 38);
    assert.strictEqual(result.trafficStatus, "SUBMERGED_CLOSED");
    assert.strictEqual(result.isClosed, true);
    assert.strictEqual(result.alertSeverity, "RED_EMERGENCY");
    assert(result.broadcastAlert !== null);
    assert(result.broadcastAlert.smsText.includes("Gokhale Rail Overbridge"));
  });

  runTest("Maintains open traffic status when water depth is safe (14cm)", () => {
    const result = evaluateSubwayInundation("SUB-MILAN", 14);
    assert.strictEqual(result.trafficStatus, "OPEN");
    assert.strictEqual(result.isClosed, false);
    assert.strictEqual(result.broadcastAlert, null);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n═════════════════════════════════════════════════════════════════════");
  console.log(`  ENTERPRISE EXTENSIONS RESULTS: ${passedTests} PASSED / ${totalTests - passedTests} FAILED (TOTAL: ${totalTests})`);
  console.log("═════════════════════════════════════════════════════════════════════\n");

  if (passedTests === totalTests) {
    console.log("🎉 ALL 6 ENTERPRISE MUNICIPAL EXTENSIONS PASSED WITH 100% HEALTH!\n");
    process.exit(0);
  } else {
    console.error("❌ Some enterprise extension tests failed.");
    process.exit(1);
  }
}

main();
