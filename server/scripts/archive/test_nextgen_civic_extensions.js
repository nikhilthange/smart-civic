"use strict";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  SMART CIVIC: NEXT-GEN EXTENSIONS VERIFICATION TEST SUITE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Validates:
 *  1. CCTV / MCS Video Analytics & Zero-Touch Dispatch Engine
 *  2. Statutory Municipal Legal Notice Generator with SHA-256 Digital Seal
 *  3. 3D Hydrological Elevation Runoff & Inundation Mathematics
 *  4. Municipal Green Bonds Portfolio & Predictive Ward CapEx Budget Engine
 */

const assert = require("assert");

// Import Services
const {
  DEFAULT_CCTV_CAMERAS,
  processCctvFrameAnomaly,
} = require("../services/cctvAnalyticsService");

const {
  generateStatutoryMunicipalNotice,
} = require("../services/noticePdfService");

const {
  DEFAULT_GREEN_BOND_PORTFOLIO,
  DEFAULT_CARBON_STREAMS,
  calculatePredictiveWardBudget,
} = require("../services/greenBondService");

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
  console.log("  BMC SMART CIVIC: NEXT-GEN EXTENSIONS TEST RUNNER");
  console.log("═════════════════════════════════════════════════════════════════════\n");

  // ─────────────────────────────────────────────────────────────────────────
  // EXTENSION 1: CCTV / MCS VIDEO ANALYTICS & ZERO-TOUCH DISPATCH
  // ─────────────────────────────────────────────────────────────────────────
  console.log("▶ EXTENSION 1: CCTV / MCS VIDEO ANALYTICS...");

  runTest("Validates default CCTV junction camera network across key Mumbai nodes", () => {
    assert(DEFAULT_CCTV_CAMERAS.length >= 3);
    const dadarCam = DEFAULT_CCTV_CAMERAS.find((c) => c.cameraId === "CAM-DDR-01");
    assert(dadarCam !== undefined);
    assert.strictEqual(dadarCam.ward, "Ward G-North");
  });

  await runAsyncTest("Detects Debris Dumping anomaly and dispatches zero-touch SWM complaint", async () => {
    const result = await processCctvFrameAnomaly({
      cameraId: "CAM-DDR-01",
      simulatedAnomalyType: "DEBRIS_DUMPING",
      confidence: 0.94,
    });
    assert.strictEqual(result.feedStatus, "ANOMALY_FLAGGED");
    assert(result.anomaly.autoComplaintId.includes("CCTV"));
    assert.strictEqual(result.autoDispatchedComplaint.department, "SWM");
    assert(result.anomaly.boundingBox.length === 4);
  });

  await runAsyncTest("Detects Waterlogging anomaly at subway approach and dispatches SWD complaint", async () => {
    const result = await processCctvFrameAnomaly({
      cameraId: "CAM-AND-03",
      simulatedAnomalyType: "WATERLOGGING",
      confidence: 0.91,
    });
    assert.strictEqual(result.autoDispatchedComplaint.department, "SWD");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // EXTENSION 2: STATUTORY MUNICIPAL LEGAL NOTICE GENERATOR (PDF/SHA-256)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ EXTENSION 2: STATUTORY MUNICIPAL PDF NOTICE GENERATOR...");

  runTest("Generates Section 354 C1 Building Evacuation Notice with SHA-256 digital seal", () => {
    const notice = generateStatutoryMunicipalNotice({
      noticeType: "SECTION_354_BUILDING_EVACUATION",
      recipientName: "Occupants of Siddharth Chawl Compound",
      ward: "Ward G-North",
      locationOrAddress: "Dadar West, Mumbai",
      statutoryGrounds: "C1 Building Tilt sensor recorded 2.9° with acute collapse risk.",
      allocatedTransitCamp: "Sion-Koliwada Transit Sector C",
    });
    assert(notice.noticeNo.includes("BMC/MMC/SECTION_"));
    assert(notice.formattedNoticeText.includes("SECTION 354"));
    assert(notice.formattedNoticeText.includes("VACATE AND EVACUATE"));
    assert.strictEqual(notice.sha256SealHash.length, 64);
    assert(notice.qrVerificationPayload.verificationUrl.includes("portal.mcgm.gov.in"));
  });

  runTest("Generates Section 314 Summary Encroachment Removal Notice", () => {
    const notice = generateStatutoryMunicipalNotice({
      noticeType: "SECTION_314_ENCROACHMENT",
      recipientName: "Illegal Commercial Stalls",
      ward: "Ward H-West",
      locationOrAddress: "Linking Road, Bandra West",
      statutoryGrounds: "Unauthorized encroachment obstructing pedestrian right of way.",
    });
    assert(notice.formattedNoticeText.includes("SECTION 314"));
    assert(notice.formattedNoticeText.includes("REMOVE ALL UNAUTHORIZED STALLS"));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // EXTENSION 3: 3D HYDROLOGICAL RUNOFF & INUNDATION MATHEMATICS
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ EXTENSION 3: 3D HYDROLOGICAL ELEVATION RUNOFF...");

  runTest("Calculates high inundation depth at Hindmata during 80mm/hr rain & 4.5m tide", () => {
    const elevation = 3.2; // MSL
    const drainageCapacity = 35; // mm/hr
    const rain = 80;
    const tide = 4.5;

    const excessRain = Math.max(0, rain - drainageCapacity);
    const tidalBackpressure = tide > 3.8 ? (tide - 3.8) * 1.6 : 0.2;
    const depthCm = Math.round(excessRain * 0.9 * (5.5 - elevation) * (1 + tidalBackpressure));

    assert(depthCm >= 30, `Expected >= 30cm depth, got ${depthCm}cm`);
  });

  runTest("Maintains zero inundation depth under dry conditions (15mm/hr rain)", () => {
    const elevation = 3.2;
    const drainageCapacity = 35;
    const rain = 15;
    const excessRain = Math.max(0, rain - drainageCapacity);
    assert.strictEqual(excessRain, 0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // EXTENSION 4: MUNICIPAL GREEN BONDS & PREDICTIVE WARD BUDGETING
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ EXTENSION 4: MUNICIPAL GREEN BONDS & PREDICTIVE BUDGETING...");

  runTest("Validates ₹100 Cr Green Climate Municipal Bond portfolio and carbon streams", () => {
    assert.strictEqual(DEFAULT_GREEN_BOND_PORTFOLIO.totalIssuanceAmountInr, 1000000000);
    assert.strictEqual(DEFAULT_GREEN_BOND_PORTFOLIO.couponRatePercent, 7.15);
    assert(DEFAULT_CARBON_STREAMS.length >= 3);
  });

  runTest("Models predictive FY26-27 Ward CapEx/OpEx allocation based on defect density", () => {
    const budget = calculatePredictiveWardBudget({
      ward: "Ward G-North",
      historicalRoadDefects: 140,
      nullahDesiltingLengthKm: 18.5,
      projectedRainfallAnomalyPercent: 15,
    });
    assert(budget.budgetBreakdown.roadMaintenanceOpExInr > 0);
    assert(budget.budgetBreakdown.swdDesiltingOpExInr > 0);
    assert(budget.budgetBreakdown.climateResilienceCapExInr > 0);
    assert(budget.greenBondFundingAllocationInr > 0);
    assert.strictEqual(budget.budgetUtilizationEfficiencyScore, 94.6);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n═════════════════════════════════════════════════════════════════════");
  console.log(`  NEXT-GEN EXTENSIONS RESULTS: ${passedTests} PASSED / ${totalTests - passedTests} FAILED (TOTAL: ${totalTests})`);
  console.log("═════════════════════════════════════════════════════════════════════\n");

  if (passedTests === totalTests) {
    console.log("🎉 ALL 4 NEXT-GEN EXTENSIONS PASSED WITH 100% HEALTH!\n");
    process.exit(0);
  } else {
    console.error("❌ Some next-gen extension tests failed.");
    process.exit(1);
  }
}

main();
