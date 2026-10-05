"use strict";

const assert = require("assert");
const http = require("http");
const axios = require("axios");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDB = require("../config/db");
const app = require("../index");

async function testRoadPassport() {
  console.log("\n================================================================================");
  console.log("🛣️  TESTING DIGITAL ROAD PASSPORT & QR WARRANTY AUDIT API");
  console.log("================================================================================\n");

  // Connect to MongoDB
  await connectDB();

  const port = 57099;
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(port, resolve));
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Fetch valid demo road passport (DLP-HW-8812)
    console.log("▶ [Test 1] Fetching live Road Passport for contract [DLP-HW-8812]...");
    const res = await axios.get(`${baseUrl}/api/dlp/passport/DLP-HW-8812`);
    
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.success, "Response success is true");
    assert.ok(res.data.passport, "Passport object exists");
    assert.strictEqual(res.data.passport.contractId, "DLP-HW-8812");
    assert.ok(res.data.passport.sha256Seal, "Cryptographic SHA-256 seal present");
    assert.ok(Number.isFinite(res.data.passport.daysRemaining), "Days remaining is numeric");
    assert.ok(res.data.passport.retentionFundAmountInr > 0, "Retention fund amount is positive");
    assert.ok(res.data.passport.statutoryActClause.includes("MMC Act"), "Statutory clause attached");
    console.log(`  ✅ PASSED: Retrieved Road Passport for "${res.data.passport.roadName}"`);
    console.log(`     - Contractor: ${res.data.passport.contractorName}`);
    console.log(`     - Warranty Days Remaining: ${res.data.passport.daysRemaining} days (${res.data.passport.totalWarrantyDays} total)`);
    console.log(`     - Retention Escrow Guarantee: ₹${res.data.passport.retentionFundAmountInr.toLocaleString()}`);
    console.log(`     - SHA-256 Audit Seal: ${res.data.passport.sha256Seal.slice(0, 16)}...`);

    // 2. Test 404 for non-existent contract
    console.log("\n▶ [Test 2] Querying non-existent contract ID [DLP-INVALID-999]...");
    try {
      await axios.get(`${baseUrl}/api/dlp/passport/DLP-INVALID-999`);
      assert.fail("Should have thrown 404");
    } catch (err404) {
      assert.strictEqual(err404.response.status, 404);
      assert.strictEqual(err404.response.data.success, false);
      console.log(`  ✅ PASSED: Correctly returned 404 with helpful suggestions: ${JSON.stringify(err404.response.data.sampleContractIds)}`);
    }

    console.log("\n================================================================================");
    console.log("🎉 DIGITAL ROAD PASSPORT BACKEND VERIFIED 100% OPERATIONAL!");
    console.log("================================================================================\n");
  } finally {
    server.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
    }
  }
}

testRoadPassport()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
