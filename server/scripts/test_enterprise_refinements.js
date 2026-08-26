/**
 * ─── Automated Verification: Enterprise Municipal Refinements Suite ───────────
 * Tests:
 *  1. Spatial-Temporal 35m Deduplication & Parent-Child Cluster Merge
 *  2. Live Worker Dispatch Distance & Traffic ETA Calculation
 *  3. Contractor 3-Strike Debarment & Performance Escrow Freeze
 *  4. ALM Housing Society Segregation & 5% Property Tax Rebate Math
 */

const assert = require("assert");
const ticketDeduplicationService = require("../services/ticketDeduplicationService");
const workerTrackingService = require("../services/workerTrackingService");
const contractorAuditService = require("../services/contractorAuditService");
const almGovernanceService = require("../services/almGovernanceService");

function runTests() {
  console.log("================================================================================");
  console.log("🏙️ TESTING ENTERPRISE MUNICIPAL REFINEMENTS");
  console.log("================================================================================\n");

  let passed = 0;

  // ─── Test 1: 35m Haversine Deduplication Distance Math ────────────────────────
  console.log("Test 1: Spatial Deduplication Distance & Cluster Radius");
  // Point A: Linking Road (19.0596, 72.8347)
  // Point B: 20 meters away (19.05975, 72.83485)
  // Point C: 450 meters away (19.0635, 72.8350)
  const distNearby = ticketDeduplicationService.calculateDistanceMeters(19.0596, 72.8347, 19.05975, 72.83485);
  const distFar = ticketDeduplicationService.calculateDistanceMeters(19.0596, 72.8347, 19.0635, 72.8350);

  assert(distNearby <= 35, `Expected <= 35m, got ${distNearby}m`);
  assert(distFar > 35, `Expected > 35m, got ${distFar}m`);
  console.log(`  ✅ 35m spatial cluster distance verified: Nearby = ${distNearby}m (<=35m), Far = ${distFar}m (>35m)`);
  passed++;

  // ─── Test 2: Live Worker Dispatch ETA Algorithm ──────────────────────────────
  console.log("\nTest 2: Live Worker Dispatch ETA & Arrival Status");
  const workerCoords = [72.8315, 19.0540];
  const incidentCoords = [72.8347, 19.0596];
  const dispatchEta = workerTrackingService.calculateDispatchETA(workerCoords, incidentCoords);

  assert(dispatchEta.distanceMeters > 0);
  assert(dispatchEta.etaMinutes >= 1);
  assert.strictEqual(dispatchEta.status, "EN_ROUTE");
  console.log(`  ✅ Field crew ETA calculation accurate: ${dispatchEta.etaMinutes} mins (${dispatchEta.distanceKm} km)`);
  passed++;

  // ─── Test 3: Contractor 3-Strike Debarment & Escrow Freeze ─────────────────────
  console.log("\nTest 3: Contractor 3-Strike Debarment & Escrow Freeze");
  const testContractor = {
    contractorId: "CON-TEST-99",
    companyName: "Defective Roads Corp",
    strikesCount: 3,
    escrowBalanceInr: 2500000,
    frozenEscrowInr: 0,
  };

  const debarmentResult = contractorAuditService.evaluateContractorStatus(testContractor);
  assert.strictEqual(debarmentResult.status, "BLACKLISTED_FROZEN");
  assert.strictEqual(testContractor.escrowBalanceInr, 0);
  assert.strictEqual(testContractor.frozenEscrowInr, 2500000);
  assert(testContractor.statutoryDebarmentOrder.orderNumber.startsWith("BMC/DEBAR/"));
  console.log(`  ✅ 3-Strike debarment triggered: Escrow ₹${testContractor.frozenEscrowInr.toLocaleString()} FROZEN and status set to BLACKLISTED_FROZEN`);
  passed++;

  // ─── Test 4: ALM Society 5% Property Tax Rebate Math ─────────────────────────
  console.log("\nTest 4: ALM Society 5% Property Tax Rebate Qualification");
  // Qualifying society: 92% segregation + compost pit
  const qualified = almGovernanceService.calculateTaxRebateEligibility(92, true);
  assert.strictEqual(qualified.isEligible, true);
  assert.strictEqual(qualified.rebatePercentage, 5);

  // Non-qualifying society: 72% segregation + compost pit
  const lowSegregation = almGovernanceService.calculateTaxRebateEligibility(72, true);
  assert.strictEqual(lowSegregation.isEligible, false);
  assert.strictEqual(lowSegregation.rebatePercentage, 0);

  // Non-qualifying society: 90% segregation but NO compost pit
  const noCompost = almGovernanceService.calculateTaxRebateEligibility(90, false);
  assert.strictEqual(noCompost.isEligible, false);
  assert.strictEqual(noCompost.rebatePercentage, 0);

  console.log("  ✅ ALM Property tax rebate rules verified (≥85% wet/dry + compost pit required)");
  passed++;

  console.log("\n================================================================================");
  console.log(`🎉 ALL ${passed}/${passed} ENTERPRISE MUNICIPAL REFINEMENT TESTS PASSED!`);
  console.log("================================================================================\n");
}

runTests();
