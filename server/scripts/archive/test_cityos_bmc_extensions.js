"use strict";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  SMART CIVIC: 6 ENTERPRISE CITYOS SUBSYSTEMS AUTOMATED TEST SUITE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Validates the 6 Enterprise CityOS Extensions:
 *  1. C1 Dilapidated Building Collapse Radar (Tilt & Crack Gauges)
 *  2. Mangrove & CRZ-I Satellite/Drone Sentinel (NDVI Change Detection)
 *  3. High-Rise Fire Safety Wet-Riser & MFB Command Radar
 *  4. 3D Spatial Property Tax & Commercial Leakage AI (LiDAR Area Reconcile)
 *  5. BEST Transit Lane Edge Dashcam Vision & ANPR Challan
 *  6. Animal Welfare (ABC), Stray Cattle & Rabies Radar
 */

const assert = require("assert");

// Import Services
const { processStructuralTelemetry } = require("../services/structuralHealthService");
const { processCoastalScanTelemetry } = require("../services/coastalSentinelService");
const { processFireRiserTelemetry } = require("../services/fireSafetyService");
const { calculatePropertyTaxDeficit } = require("../services/taxAuditService");
const { generateTransitLaneChallan } = require("../services/transitLaneService");
const { calculateRabiesRiskIndex, generateVeterinaryDrive } = require("../services/animalWelfareService");

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
  console.log("  BMC SMART CIVIC: 6 ENTERPRISE CITYOS SUBSYSTEMS TEST RUNNER");
  console.log("═════════════════════════════════════════════════════════════════════\n");

  // ─────────────────────────────────────────────────────────────────────────
  // 1. C1 DILAPIDATED BUILDING COLLAPSE RADAR
  // ─────────────────────────────────────────────────────────────────────────
  console.log("▶ MODULE 1: C1 DILAPIDATED BUILDING COLLAPSE RADAR...");

  await runAsyncTest("Triggers IMMINENT_COLLAPSE_HAZARD and transit camp allocation when tilt >= 2.5°", async () => {
    const result = await processStructuralTelemetry({
      buildingId: "BLD-GN-01",
      tiltAngleDegrees: 2.9,
      crackDisplacementMm: 14.2,
      vibrationIndexHz: 5.8,
    });
    assert.strictEqual(result.isImminentHazard, true);
    assert.strictEqual(result.status, "IMMINENT_COLLAPSE_HAZARD");
    assert.strictEqual(result.transitCampAllocated, true);
    assert(result.evacuationNotice !== null);
    assert.strictEqual(result.evacuationNotice.action, "MANDATORY_IMMEDIATE_EVACUATION");
  });

  await runAsyncTest("Keeps building as STABLE_MONITORED when tilt (0.8°) and crack (4.5mm) are nominal", async () => {
    const result = await processStructuralTelemetry({
      buildingId: "BLD-KW-03",
      tiltAngleDegrees: 0.8,
      crackDisplacementMm: 4.5,
      vibrationIndexHz: 1.5,
    });
    assert.strictEqual(result.isImminentHazard, false);
    assert.strictEqual(result.status, "STABLE_MONITORED");
    assert.strictEqual(result.evacuationNotice, null);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. MANGROVE & CRZ-I SATELLITE SENTINEL
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ MODULE 2: MANGROVE & CRZ-I SATELLITE / DRONE SENTINEL...");

  await runAsyncTest("Issues STOP-WORK injunction to State Mangrove Cell when NDVI loss > 25%", async () => {
    const result = await processCoastalScanTelemetry({
      zoneId: "CRZ-KW-01",
      baselineNdvi: 0.78,
      currentNdvi: 0.50, // 35.9% loss
      debrisDumpingDetected: true,
    });
    assert.strictEqual(result.isCriticalLoss, true);
    assert.strictEqual(result.status, "CRITICAL_CRZ_DESTRUCTION");
    assert(result.vegetationLossPercentage > 25.0);
    assert(result.injunction !== null);
    assert(result.injunction.injunctionOrder.includes("CRZ-I STOP-WORK INJUNCTION"));
  });

  await runAsyncTest("Maintains PROTECTED_HEALTHY status when canopy loss is within natural variance (< 10%)", async () => {
    const result = await processCoastalScanTelemetry({
      zoneId: "CRZ-GN-02",
      baselineNdvi: 0.82,
      currentNdvi: 0.78, // 4.9% loss
      debrisDumpingDetected: false,
    });
    assert.strictEqual(result.isCriticalLoss, false);
    assert.strictEqual(result.status, "PROTECTED_HEALTHY");
    assert.strictEqual(result.injunction, null);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. HIGH-RISE FIRE SAFETY WET-RISER & NOC RADAR
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ MODULE 3: HIGH-RISE FIRE SAFETY WET-RISER & NOC RADAR...");

  await runAsyncTest("Flags DRY_RISER_FAILURE_CRITICAL and links ₹25,000 citation to Property Tax SAC when riser < 3.5 kg/cm² for > 30m", async () => {
    const result = await processFireRiserTelemetry({
      buildingId: "FIRE-HW-01",
      wetRiserPressureKgCm2: 2.0,
      pressureLossDurationMinutes: 45,
    });
    assert.strictEqual(result.isCriticalLoss, true);
    assert.strictEqual(result.status, "DRY_RISER_FAILURE_CRITICAL");
    assert.strictEqual(result.mfbRadarFlagged, true);
    assert(result.mfbDispatchNotice !== null);
    assert.strictEqual(result.mfbDispatchNotice.citationPenaltyInr, 25000);
    assert(result.mfbDispatchNotice.taxNotice.includes("SAC Account"));
  });

  await runAsyncTest("Maintains OPERATIONAL status when booster pressure is 5.2 kg/cm²", async () => {
    const result = await processFireRiserTelemetry({
      buildingId: "FIRE-GN-02",
      wetRiserPressureKgCm2: 5.2,
      pressureLossDurationMinutes: 0,
    });
    assert.strictEqual(result.isCriticalLoss, false);
    assert.strictEqual(result.status, "OPERATIONAL");
    assert.strictEqual(result.mfbDispatchNotice, null);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. 3D SPATIAL PROPERTY TAX & COMMERCIAL LEAKAGE AI
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ MODULE 4: 3D SPATIAL PROPERTY TAX & REVENUE LEAKAGE AI...");

  runTest("Calculates tax leakage deficit + 200% statutory penalty when physical area exceeds declared area by > 15%", () => {
    const audit = calculatePropertyTaxDeficit({
      assessedCarpetAreaSqFt: 1800,
      lidarMeasuredAreaSqFt: 2750, // 52.8% discrepancy
      permittedLandUse: "RESIDENTIAL",
      detectedActualUse: "COMMERCIAL_UNAUTHORIZED",
      hasRooftopExtension: true,
    });
    assert.strictEqual(audit.isAreaBreached, true);
    assert.strictEqual(audit.isLandUseBreached, true);
    assert.strictEqual(audit.isViolation, true);
    assert.strictEqual(audit.status, "REVENUE_LEAKAGE_FLAGGED");
    assert.strictEqual(audit.penaltyAmountInr, Math.round(audit.estimatedTaxDeficitInr * 2.0));
    assert(audit.totalRecoveryInr > audit.estimatedTaxDeficitInr);
  });

  runTest("Confirms CLEAN_ASSESSMENT when LiDAR area matches declared within 15% tolerance", () => {
    const audit = calculatePropertyTaxDeficit({
      assessedCarpetAreaSqFt: 1200,
      lidarMeasuredAreaSqFt: 1240, // 3.3% discrepancy
      permittedLandUse: "RESIDENTIAL",
      detectedActualUse: "RESIDENTIAL",
      hasRooftopExtension: false,
    });
    assert.strictEqual(audit.isViolation, false);
    assert.strictEqual(audit.status, "CLEAN_ASSESSMENT");
    assert.strictEqual(audit.totalRecoveryInr, 0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. BEST TRANSIT LANE DASHCAM ANPR CHALLAN
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ MODULE 5: BEST TRANSIT LANE DASHCAM ANPR CHALLAN...");

  runTest("Generates ₹1,500 Traffic Police e-challan for private car obstructing BKC BRTS lane", () => {
    const challan = generateTransitLaneChallan({
      bestBusVehicleId: "BEST-EV-902",
      routeCorridorName: "Bandra-Kurla Complex Dedicated BRTS Corridor",
      ward: "Ward H-East",
      vehiclePlateNo: "mh-02-eq-8819",
      vehicleType: "PRIVATE_CAR",
      transitDelaySeconds: 150,
    });
    assert.strictEqual(challan.challanAmountInr, 1500);
    assert.strictEqual(challan.vehiclePlateNo, "MH-02-EQ-8819");
    assert.strictEqual(challan.towingVehicleDispatched, true);
    assert(challan.policeNotice.includes("BEST BUS LANE VIOLATION"));
  });

  runTest("Levies commercial rate ₹3,000 for heavy truck obstruction in transit lane", () => {
    const challan = generateTransitLaneChallan({
      bestBusVehicleId: "BEST-CNG-418",
      routeCorridorName: "JVLR Bus Lane",
      ward: "Ward K-East",
      vehiclePlateNo: "MH-04-AB-3301",
      vehicleType: "COMMERCIAL_TRUCK",
      transitDelaySeconds: 240,
    });
    assert.strictEqual(challan.challanAmountInr, 3000);
    assert.strictEqual(challan.towingVehicleDispatched, true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. ANIMAL WELFARE (ABC), STRAY CATTLE & RABIES RADAR
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ MODULE 6: ANIMAL WELFARE, STRAY CATTLE & RABIES RADAR...");

  runTest("Calculates CRITICAL_RABIES_SURGE risk score when dog bites >= 14 and pack aggression is high", () => {
    const risk = calculateRabiesRiskIndex(16, 82);
    assert(risk.riskScore >= 70);
    assert.strictEqual(risk.riskLevel, "CRITICAL_RABIES_SURGE");
    assert.strictEqual(risk.recommendedAction, "IMMEDIATE_ABC_STERILIZATION_AND_ANTI_RABIES_DRIVE");
  });

  runTest("Generates targeted veterinary ABC sterilization & anti-rabies drive for ward sectors", () => {
    const drive = generateVeterinaryDrive("Ward G-North");
    assert(drive.estimatedVaccineDoses > 0);
    assert.strictEqual(drive.mobileAbcVansDispatched, 2);
    assert(drive.dispatchOrder.includes("BMC VETERINARY DISPATCH"));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n═════════════════════════════════════════════════════════════════════");
  console.log(`  CITYOS SUBSYSTEMS RESULTS: ${passedTests} PASSED / ${totalTests - passedTests} FAILED (TOTAL: ${totalTests})`);
  console.log("═════════════════════════════════════════════════════════════════════\n");

  if (passedTests === totalTests) {
    console.log("🎉 ALL 6 ENTERPRISE CITYOS SUBSYSTEMS PASSED WITH 100% HEALTH!\n");
    process.exit(0);
  } else {
    console.error("❌ Some CityOS subsystem tests failed.");
    process.exit(1);
  }
}

main();
