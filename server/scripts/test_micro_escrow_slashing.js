"use strict";

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const ContractorMicroEscrow = require("../models/ContractorMicroEscrow");
const ContractorScorecard = require("../models/ContractorScorecard");
const contractorMicroEscrowService = require("../services/contractorMicroEscrowService");

async function runTest() {
  console.log("================================================================================");
  console.log("💰 TESTING REAL CONTRACTOR MICRO-ESCROW & CITIZEN SLASHING PROTOCOL");
  console.log("================================================================================");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/smart-civic";
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

  // 1. Test Summary & Seeding
  const summary = await contractorMicroEscrowService.getWardDividendPoolSummary();
  console.log(`\nTest 1: Ward Citizen Dividend Pool Summary`);
  console.log(`  ✅ Global Slashed in Pool: ₹${summary.global.totalSlashedInr.toLocaleString("en-IN")}`);
  console.log(`  ✅ Global DLP Retained: ₹${summary.global.totalDlpRetainedInr.toLocaleString("en-IN")}`);
  console.log(`  ✅ Wards Tracked: ${summary.wardBreakdown.length} Wards`);
  if (summary.global.totalSlashedInr < 5000) {
    throw new Error("Expected at least ₹5,000 slashed funds seeded in pool.");
  }

  // 2. Test Micro-Escrow Allocation
  console.log(`\nTest 2: Allocate Micro-Escrow for Pothole Remediations`);
  const allocated = await contractorMicroEscrowService.allocateMicroEscrow({
    contractorId: "CON-HW-TEST-99",
    companyName: "Khar Paving & Asphalt Engineers",
    complaintId: "SC-2026-TEST-9999",
    complaintTitle: "S.V. Road Junction Asphalt Depression",
    ward: "Ward H-West",
    collateralAmountInr: 5000,
  });
  console.log(`  ✅ Allocated Escrow ID: ${allocated.escrowId} (Status: ${allocated.status}, Hash: ${allocated.transactionHash?.slice(0, 16)}...)`);
  if (allocated.collateralAmountInr !== 5000 || allocated.status !== "ALLOCATED_HELD") {
    throw new Error("Escrow allocation mismatch.");
  }

  // 3. Test Verified ZNCC Release (80% released, 20% DLP locked)
  console.log(`\nTest 3: Release 80% on Verified ZNCC Proof (Confidence: 0.95)`);
  const released = await contractorMicroEscrowService.releaseOnVerifiedProof(allocated.escrowId, 0.95);
  console.log(`  ✅ Released: ₹${released.releasedAmountInr} (80%) | DLP Locked: ₹${released.dlpRetainedAmountInr} (20%)`);
  console.log(`  ✅ DLP Release Date: ${released.dlpReleaseDate.toISOString().split("T")[0]}`);
  if (released.releasedAmountInr !== 4000 || released.dlpRetainedAmountInr !== 1000) {
    throw new Error("ZNCC release distribution math incorrect.");
  }

  // 4. Test Slashing on Fraudulent Proof (Slashed directly to Citizen Pool)
  console.log(`\nTest 4: Slashing Fraudulent Escrow into Citizen Welfare Dividend Pool`);
  const toSlash = await contractorMicroEscrowService.allocateMicroEscrow({
    contractorId: "CON-HW-TEST-99",
    companyName: "Khar Paving & Asphalt Engineers",
    complaintId: "SC-2026-TEST-FRAUD",
    complaintTitle: "Waterlogging at Khar Subway",
    ward: "Ward H-West",
    collateralAmountInr: 5000,
  });
  const slashed = await contractorMicroEscrowService.slashToCitizenDividendPool(
    toSlash.escrowId,
    "Uploaded stock photo of dry pavement during active 60mm cloudburst",
    "Ward AMC Vigilance Unit"
  );
  console.log(`  ✅ Slashed Amount: ₹${slashed.slashedAmountInr} (Status: ${slashed.status})`);
  console.log(`  ✅ Statutory Reason: "${slashed.slashedReason}"`);
  if (slashed.status !== "SLASHED_TO_CITIZEN_POOL" || slashed.slashedAmountInr !== 5000) {
    throw new Error("Slashing protocol failed.");
  }

  // Cleanup test documents
  await ContractorMicroEscrow.deleteMany({ contractorId: "CON-HW-TEST-99" });
  await ContractorScorecard.deleteOne({ contractorId: "CON-HW-TEST-99" });
  await mongoose.disconnect();

  console.log("\n================================================================================");
  console.log("🎉 ALL 4/4 REAL CONTRACTOR MICRO-ESCROW TESTS PASSED (ZERO MOCK DATA)!");
  console.log("================================================================================");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
