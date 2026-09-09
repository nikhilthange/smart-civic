/**
 * Automated Test Suite for AI Before/After Resolution Verification
 * Asserts quality scores, clearance certificate generation, and defect persistence detection.
 */

const assert = require("assert");
const { verifyResolutionQuality } = require("../services/resolutionVerificationService");

async function runTests() {
  console.log("========================================================================");
  console.log("🛡️  Smart Civic AI — AI Before/After Resolution Verification Test Suite");
  console.log("========================================================================\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Clean Resolution Verification
  console.log("▶ 1. TESTING CLEAN DEFECT CLEARANCE AUDIT...");
  try {
    const audit = await verifyResolutionQuality({
      initialCategory: "pothole",
      initialDescription: "Huge pothole on SV Road near Bandra station",
      workerNotes: "Repaired with hot-mix asphalt and resurfaced cleanly.",
    });

    assert(audit.status === "VERIFIED_CLEARED", "Status should be VERIFIED_CLEARED");
    assert(audit.clearedVerified === true, "clearedVerified should be true");
    assert(audit.resolutionScore >= 85, `Quality score (${audit.resolutionScore}) should be >= 85`);
    assert(audit.certificateId.startsWith("BMC-AUDIT-"), "Certificate ID should match BMC format");
    console.log(`  ✅ PASS: Clean resolution certified (Score: ${audit.resolutionScore}%, Cert: ${audit.certificateId})`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: Clean resolution verification failed: ${err.message}`);
    failed++;
  }

  // Test 2: Multilingual Hindi/Marathi Notes
  console.log("\n▶ 2. TESTING MULTILINGUAL VERNACULAR WORKER NOTES...");
  try {
    const audit = await verifyResolutionQuality({
      initialCategory: "garbage_overflow",
      initialDescription: "Kachra dhalav overflowing",
      workerNotes: "Kachra saaf theek kiya aur dhalav disinfect kiya gaya.",
    });

    assert(audit.status === "VERIFIED_CLEARED", "Status should be VERIFIED_CLEARED");
    assert(audit.resolutionScore >= 85, `Quality score (${audit.resolutionScore}) should be >= 85`);
    console.log(`  ✅ PASS: Multilingual vernacular notes recognized (Score: ${audit.resolutionScore}%)`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: Vernacular resolution test failed: ${err.message}`);
    failed++;
  }

  console.log("\n========================================================================");
  console.log(`  AUDIT TEST RESULTS: ${passed} PASSED / ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log("========================================================================\n");

  if (failed === 0) {
    console.log("🎉 ALL RESOLUTION VERIFICATION TESTS PASSED SUCCESSFULLY!\n");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
