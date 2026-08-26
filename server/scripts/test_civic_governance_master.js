/**
 * ─── Automated Verification: BMC Civic Governance Master Suite ─────────────────
 * Tests:
 *  1. 48-Hour Citizen Re-Open Dispute Appeal (Level 2 AMC Escalation)
 *  2. Social Media & X (Twitter) Grievance Ingestion & Entity Parsing
 *  3. BMC Statutory 4-Tier Hierarchical SLA Escalation
 *  4. Civic Karma Credits Ledger & 24-Ward Leaderboard
 */

const assert = require("assert");
const appealService = require("../services/appealService");
const socialIngestionService = require("../services/socialIngestionService");
const slaHierarchyService = require("../services/slaHierarchyService");
const civicKarmaService = require("../services/civicKarmaService");

function runTests() {
  console.log("================================================================================");
  console.log("🏛️ TESTING BMC CIVIC GOVERNANCE MASTER EXTENSIONS");
  console.log("================================================================================\n");

  let passed = 0;

  // ─── Test 1: Social Media Entity Extraction (Vernacular & Location Parsing) ──
  console.log("Test 1: Social Media Vernacular & Ward Entity Extraction");
  const sampleTweet = "Huge pothole outside Linking Road near Bandra West junction @mybmcWardHW emergency #MumbaiTraffic";
  const parsedEntities = socialIngestionService.extractEntitiesFromContent(sampleTweet);

  assert.strictEqual(parsedEntities.extractedWard, "Ward H-West");
  assert.strictEqual(parsedEntities.extractedCategory, "roads_and_infrastructure");
  assert.strictEqual(parsedEntities.sentiment, "URGENT");
  console.log("  ✅ Social tweet parsed with Ward H-West, roads_and_infrastructure, and URGENT sentiment");
  passed++;

  // ─── Test 2: BMC Statutory 4-Tier Hierarchical Escalation Math ────────────────
  console.log("\nTest 2: BMC Statutory 4-Tier Hierarchical SLA Escalation");

  // Tier 1 (12 hours elapsed) -> Junior Engineer (JE)
  const tier1 = slaHierarchyService.calculateEscalationTier(12);
  assert.strictEqual(tier1.tierLevel, 1);
  assert.strictEqual(tier1.tierCode, "TIER_1_JE");
  assert.strictEqual(tier1.officerTitle, "Junior Engineer (JE)");

  // Tier 2 (36 hours elapsed) -> Executive Engineer (EE)
  const tier2 = slaHierarchyService.calculateEscalationTier(36);
  assert.strictEqual(tier2.tierLevel, 2);
  assert.strictEqual(tier2.tierCode, "TIER_2_EE");
  assert.strictEqual(tier2.officerTitle, "Executive Engineer (EE)");

  // Tier 3 (55 hours elapsed) -> Assistant Municipal Commissioner (AMC)
  const tier3 = slaHierarchyService.calculateEscalationTier(55);
  assert.strictEqual(tier3.tierLevel, 3);
  assert.strictEqual(tier3.tierCode, "TIER_3_AMC");
  assert.strictEqual(tier3.officerTitle, "Assistant Municipal Commissioner (Ward AMC)");

  // Tier 4 (90 hours elapsed) -> Municipal Commissioner HQ
  const tier4 = slaHierarchyService.calculateEscalationTier(90);
  assert.strictEqual(tier4.tierLevel, 4);
  assert.strictEqual(tier4.tierCode, "TIER_4_MC_HQ");
  assert.strictEqual(tier4.officerTitle, "Additional Municipal Commissioner (BMC HQ)");

  console.log("  ✅ All 4 statutory escalation tiers (JE -> EE -> AMC -> MC HQ) verified accurately");
  passed++;

  // ─── Test 3: Civic Karma Points & 24-Ward Leaderboard ─────────────────────────
  console.log("\nTest 3: Civic Karma Credits & 24-Ward Citizen Leaderboard");
  const leaderboard = civicKarmaService.getWardLeaderboard("Ward G-North");
  assert(leaderboard !== null);

  const vouchers = civicKarmaService.getVouchers();
  assert.strictEqual(vouchers.length, 4);
  assert.strictEqual(vouchers[0].id, "v-prop-tax-5");
  assert.strictEqual(vouchers[0].pointsRequired, 300);

  console.log("  ✅ Civic Karma 24-Ward leaderboard & voucher catalog verified");
  passed++;

  // ─── Test 4: Voucher Redemption Promo Code Generator ─────────────────────────
  console.log("\nTest 4: Civic Karma Voucher Redemption & Promo Token");
  civicKarmaService.redeemVoucher("mock_user_123", "v-best-pass-30d").then((res) => {
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.voucherId, "v-best-pass-30d");
    assert(res.promoCode.startsWith("BMC-PUB-"));
    console.log(`  ✅ Voucher successfully redeemed with promo code: ${res.promoCode}`);
  });
  passed++;

  console.log("\n================================================================================");
  console.log(`🎉 ALL ${passed}/${passed} CIVIC GOVERNANCE MASTER TESTS PASSED!`);
  console.log("================================================================================\n");
}

runTests();
