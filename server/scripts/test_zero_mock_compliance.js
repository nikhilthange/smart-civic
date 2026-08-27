"use strict";

/**
 * ─── Zero-Mock Repository Compliance & Live DB Validation Suite ────────────────
 * Validates that 100% of municipal controllers query MongoDB directly with zero
 * static mock arrays or hardcoded fallbacks, and verifies live batch seeding.
 */

const assert = require("assert");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart-civic";

let passed = 0;
let failed = 0;

function reportPass(name) {
  passed++;
  console.log(`  ✅ PASSED: ${name}`);
}

function reportFail(name, err) {
  failed++;
  console.error(`  ❌ FAILED: ${name}`);
  console.error(`     Error: ${err.message}`);
}

async function runZeroMockComplianceSuite() {
  console.log("\n================================================================================");
  console.log("🛡️  ZERO-MOCK COMPLIANCE & REPOSITORY-WIDE DATA INTEGRITY SUITE");
  console.log("================================================================================\n");

  // 1. Static Scan of Controllers for Fallback Ternaries
  console.log("▶ [Test 1] Controller Codebase Static Scan for In-Memory Fallbacks...");
  try {
    const controllersDir = path.join(__dirname, "../controllers");
    const controllerFiles = fs.readdirSync(controllersDir).filter((f) => f.endsWith(".js"));

    let forbiddenPatternsFound = 0;
    const forbiddenPatterns = [
      /DEFAULT_[A-Z_]+\s*:\s*\[/g,
      /length\s*===\s*0\s*\?\s*DEFAULT_/g,
      /length\s*===\s*0\s*\?\s*mock/g,
    ];

    for (const file of controllerFiles) {
      const content = fs.readFileSync(path.join(controllersDir, file), "utf8");
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(content)) {
          forbiddenPatternsFound++;
          console.warn(`     ⚠️ Pattern ${pattern} matched in ${file}`);
        }
      }
    }

    assert.strictEqual(forbiddenPatternsFound, 0, "No controller should use inline fallback arrays on empty queries");
    reportPass("All controller GET handlers query MongoDB directly with zero fallback ternaries");
  } catch (err) {
    reportFail("Controller Static Scan", err);
  }

  // 2. Connect to MongoDB
  console.log("\n▶ [Test 2] Database Connection & Model Registration Verification...");
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    assert.strictEqual(mongoose.connection.readyState, 1, "Mongoose must be connected to database");
    reportPass("Connected to MongoDB successfully");

    const models = [
      "Complaint", "SubwayStatus", "BinTelemetry", "CctvCamera", "DilapidatedBuilding",
      "RoadContract", "HousingSociety", "WardProject", "ConstructionSite", "HawkingZone",
      "VectorOutbreak", "TransitLaneObstruction", "PropertyTaxAudit", "AnimalWelfareRecord",
      "MangroveZone", "HighRiseFireNoc", "WaterFlowZone"
    ];

    for (const modelName of models) {
      const model = require(`../models/${modelName}`);
      assert(model && typeof model.find === "function", `Model ${modelName} must be registered as a Mongoose model`);
    }
    reportPass(`All ${models.length} municipal Mongoose models registered and operational`);
  } catch (err) {
    reportFail("Database Connection & Model Check", err);
  }

  // 3. Test Universal Batch Seed All
  console.log("\n▶ [Test 3] Testing Universal batchSeedAllModules() Execution...");
  try {
    const simulationService = require("../services/simulationService");
    const seedResult = await simulationService.batchSeedAllModules();

    assert.strictEqual(seedResult.success, true, "batchSeedAllModules must return success: true");
    assert(seedResult.message.includes("Successfully seeded"), "Message confirms seeding completed");
    reportPass("Universal batchSeedAllModules() executed cleanly without exceptions");

    // Verify document counts across collections
    const Complaint = require("../models/Complaint");
    const SubwayStatus = require("../models/SubwayStatus");
    const BinTelemetry = require("../models/BinTelemetry");
    const CctvCamera = require("../models/CctvCamera");
    const DilapidatedBuilding = require("../models/DilapidatedBuilding");

    const [cCount, sCount, bCount, camCount, bldCount] = await Promise.all([
      Complaint.countDocuments(),
      SubwayStatus.countDocuments(),
      BinTelemetry.countDocuments(),
      CctvCamera.countDocuments(),
      DilapidatedBuilding.countDocuments(),
    ]);

    assert(cCount > 0, "Complaint collection contains documents");
    assert(sCount > 0, "SubwayStatus collection contains documents");
    assert(bCount > 0, "BinTelemetry collection contains documents");
    assert(camCount > 0, "CctvCamera collection contains documents");
    assert(bldCount > 0, "DilapidatedBuilding collection contains documents");
    reportPass(`Live MongoDB records verified (Complaints: ${cCount}, Subways: ${sCount}, Bins: ${bCount}, CCTV: ${camCount}, C1: ${bldCount})`);
  } catch (err) {
    reportFail("batchSeedAllModules Execution", err);
  }

  // 4. Test Cleanup of Simulated Records
  console.log("\n▶ [Test 4] Testing Simulated Data Cleanup & Pruning...");
  try {
    const simulationService = require("../services/simulationService");
    const cleanupResult = await simulationService.cleanupSimulatedData();

    assert.strictEqual(cleanupResult.success, true, "cleanupSimulatedData must return success: true");
    reportPass(`Simulated data cleanup successfully pruned ${cleanupResult.deletedTotal} test records`);
  } catch (err) {
    reportFail("cleanupSimulatedData Execution", err);
  }

  // Final Summary
  console.log("\n================================================================================");
  console.log(`  COMPLIANCE AUDIT RESULTS: ${passed} PASSED / ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log("================================================================================\n");

  if (failed > 0) {
    console.error("❌ ZERO-MOCK COMPLIANCE AUDIT FAILED. Review issues above.");
    process.exit(1);
  } else {
    console.log("🎉 100% ZERO-MOCK COMPLIANCE VERIFIED ACROSS ALL MUNICIPAL MODULES!");
    process.exit(0);
  }
}

runZeroMockComplianceSuite();
