"use strict";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  SMART CIVIC: PLATFORM UPGRADE MASTER VERIFICATION & REGRESSION TEST SUITE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Validates the 4 Enterprise Upgrade Tracks:
 *  Track 1: Interactive GIS Visuals & Vernacular Voice Entity Extraction
 *  Track 2: YOLOv8 Defect Bounding Boxes & WhatsApp Webhook Bot Ingestion
 *  Track 3: Realistic Mumbai 24-Ward Seed Engine & Live Emergency Simulators
 *  Track 4: Tamper-Evident SHA-256 Chained Municipal Audit Ledger
 */

const assert = require("assert");

// Import Services
const { detectYoloBoundingBoxes, BMC_CLASSES } = require("../services/localVisionService");
const { parseWhatsAppGrievance } = require("../services/vernacularVoiceService");
const { generateShowCauseNotice, generateWardSituationSummary } = require("../services/copilotService");
const { recordAuditAction, verifyAuditChainIntegrity } = require("../services/auditService");
const { MUMBAI_WARDS, SEED_SUBWAYS } = require("./seed_mumbai_cityos");

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
  console.log("  BMC SMART CIVIC: PLATFORM UPGRADE MASTER TEST RUNNER");
  console.log("═════════════════════════════════════════════════════════════════════\n");

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 1: VERNACULAR VOICE NLP ENTITY EXTRACTION
  // ─────────────────────────────────────────────────────────────────────────
  console.log("▶ TRACK 1: VERNACULAR VOICE & WHATSAPP ENTITY PARSER...");

  runTest("Extracts Marathi Pothole entities from voice text (दादर स्टेशन खड्डा -> PWD)", () => {
    const parsed = parseWhatsAppGrievance("दादर स्टेशन जवळ रस्त्यावर मोठा खड्डा पडला आहे.");
    assert.strictEqual(parsed.category, "pothole");
    assert.strictEqual(parsed.ward, "Ward G-North");
    assert(parsed.matchedKeywords.includes("खड्डा") || parsed.matchedKeywords.includes("रस्ता"));
  });

  runTest("Extracts Hindi/Marathi Pipeline Leak entities (अंधेरी पश्चिम पाणी लीकेज -> WATER)", () => {
    const parsed = parseWhatsAppGrievance("अंधेरी पश्चिम मध्ये पाणी गळती सुरू आहे.");
    assert.strictEqual(parsed.category, "water_leakage");
    assert.strictEqual(parsed.ward, "Ward K-West");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 2: YOLOV8 DEFECT BOUNDING BOX DETECTION & AI COPILOT
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ TRACK 2: YOLOV8 BOUNDING BOXES & MUNICIPAL COPILOT...");

  runTest("Generates spatial bounding box coordinates [x, y, w, h] for pothole craters", () => {
    const boxes = detectYoloBoundingBoxes(BMC_CLASSES[0], 0.92);
    assert(boxes.length >= 1);
    assert(boxes[0].label.includes("Pothole"));
    assert(boxes[0].box.length === 4);
    assert(boxes[0].box[2] > 0); // width > 0
  });

  runTest("Generates statutory contractor DLP Show-Cause Notice with 48h deadline", () => {
    const notice = generateShowCauseNotice({
      contractorName: "M/s Pratibha Infrastructure Pvt Ltd",
      roadOrProjectName: "Linking Road Bituminous Overlay",
      ward: "Ward H-West",
      penaltyAmountInr: 150000,
    });
    assert(notice.noticeNo.includes("BMC/CH.ENG/RDS/WARDH-WEST"));
    assert(notice.formattedNoticeText.includes("48 HOURS"));
    assert.strictEqual(notice.deadlineHours, 48);
  });

  runTest("Generates Executive Daily Ward Situation Summary for Ward Officers", () => {
    const summary = generateWardSituationSummary({
      ward: "Ward G-North",
      activeGrievancesCount: 45,
      c1BuildingsCount: 2,
      tideHeightMeters: 4.6,
      rainfallMmHr: 35,
    });
    assert(summary.executiveSummary.includes("WARD G-NORTH"));
    assert(summary.executiveSummary.includes("Arabian Sea"));
    assert.strictEqual(summary.tideAlert, "RED_HIGH_TIDE_WARNING");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 3: REALISTIC MUMBAI 24-WARD GEO-SEED ENGINE
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ TRACK 3: MUMBAI 24-WARD GEO-SEED ENGINE...");

  runTest("Validates all 24 administrative municipal wards (A through T)", () => {
    assert.strictEqual(MUMBAI_WARDS.length, 24);
    const dadar = MUMBAI_WARDS.find((w) => w.code === "G-North");
    assert(dadar !== undefined);
    assert.strictEqual(dadar.zone, "Zone 2");
  });

  runTest("Validates 5 critical flooded subways with dynamic flyover detour coordinates", () => {
    assert.strictEqual(SEED_SUBWAYS.length, 5);
    const andheri = SEED_SUBWAYS.find((s) => s.subwayId === "SUB-ANDHERI");
    assert(andheri !== undefined);
    assert.strictEqual(andheri.trafficStatus, "SUBMERGED_CLOSED");
    assert(andheri.detourRoute.includes("Gokhale"));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 4: TAMPER-EVIDENT SHA-256 CHAINED AUDIT LEDGER
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n▶ TRACK 4: TAMPER-EVIDENT SHA-256 AUDIT LEDGER...");

  await runAsyncTest("Logs municipal action with cryptographic SHA-256 hash chaining", async () => {
    const log1 = await recordAuditAction({
      actionType: "ESCROW_PENALTY_DEDUCTION",
      ward: "Ward G-North",
      targetEntityId: "CON-ROAD-9912",
      targetEntityType: "ContractorEscrow",
      payloadSummary: "Tier 1 SLA Breach: ₹5,000 penalty deducted.",
      amountInr: 5000,
    });
    assert(log1.currentHash.length === 64);

    const log2 = await recordAuditAction({
      actionType: "TRANSIT_CAMP_ALLOCATION",
      ward: "Ward G-North",
      targetEntityId: "BLD-GN-01",
      targetEntityType: "DilapidatedBuilding",
      payloadSummary: "C1 Tiltmeter reached 3.1°. 32 Transit Passes issued.",
      amountInr: 0,
    });
    assert.strictEqual(log2.previousHash, log1.currentHash);

    const integrity = verifyAuditChainIntegrity([log1, log2]);
    assert.strictEqual(integrity.isValid, true);
    assert.strictEqual(integrity.verifiedCount, 2);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n═════════════════════════════════════════════════════════════════════");
  console.log(`  PLATFORM UPGRADE RESULTS: ${passedTests} PASSED / ${totalTests - passedTests} FAILED (TOTAL: ${totalTests})`);
  console.log("═════════════════════════════════════════════════════════════════════\n");

  if (passedTests === totalTests) {
    console.log("🎉 ALL 4 ENTERPRISE UPGRADE TRACKS PASSED WITH 100% HEALTH!\n");
    process.exit(0);
  } else {
    console.error("❌ Some upgrade tests failed.");
    process.exit(1);
  }
}

main();
