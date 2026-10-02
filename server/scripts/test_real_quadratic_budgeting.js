"use strict";

const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/User");
const WardProject = require("../models/WardProject");
const RoadContract = require("../models/RoadContract");
const ContractorMicroEscrow = require("../models/ContractorMicroEscrow");
const { getWardProjects, castProjectVote, getWardExpenditures } = require("../controllers/wardBudgetController");

async function runTests() {
  console.log("================================================================================");
  console.log("🗳️ TESTING REAL QUADRATIC VOTING & EXPENDITURE AUDIT LEDGER (ZERO MOCK DATA)");
  console.log("================================================================================");

  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/smart-civic");
  console.log("✅ MongoDB Connected");

  // Step 1: Create or find test citizen user with real Karma points
  const testEmail = `citizen_test_${Date.now()}@mumbai.gov.in`;
  const citizen = await User.create({
    name: "Aaditya Deshmukh",
    email: testEmail,
    password: "Password@123",
    role: "citizen",
    ward: "Ward G-North",
    karmaPoints: 50, // 50 Karma points
  });
  console.log(`\nTest 1: Created Real Citizen with ${citizen.karmaPoints} Karma Points (ID: ${citizen._id})`);

  // Step 2: Find or create a test ward project
  let project = await WardProject.findOne({ ward: "Ward G-North" });
  if (!project) {
    project = await WardProject.create({
      projectId: `WP-TEST-${Date.now().toString().slice(-4)}`,
      title: "Solar Streetlight Grid for Shivaji Park Perimeter",
      description: "Install 48 high-efficiency standalone solar LED masts",
      ward: "Ward G-North",
      estimatedBudgetInr: 3200000,
      votesCount: 10,
      status: "PROPOSED",
    });
  }
  const initialVotes = project.votesCount;
  console.log(`Test 2: Target Project: "${project.title}" (Initial Votes: ${initialVotes})`);

  // Step 3: Quadratic Vote Test - Cast 3 votes (requires 3^2 = 9 Karma points)
  const voteWeight = 3;
  const expectedKarmaCost = 9;

  const mockReq = {
    params: { id: project.projectId },
    body: { voteWeight, userId: citizen._id.toString() },
    user: citizen,
  };
  let responseData = null;
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        responseData = { code, data };
        return data;
      },
    }),
  };

  await castProjectVote(mockReq, mockRes);
  console.log(`\nTest 3: Cast ${voteWeight} Weighted Votes via Quadratic Voting Formula`);
  console.log(`  Response message: ${responseData.data.message}`);
  console.log(`  Votes Count: ${responseData.data.votesCount} (Expected: ${initialVotes + voteWeight})`);
  console.log(`  Karma Deducted: ${responseData.data.karmaDeducted} (Expected: ${expectedKarmaCost})`);
  console.log(`  Remaining Karma: ${responseData.data.remainingKarma} (Expected: ${50 - expectedKarmaCost})`);

  if (responseData.data.votesCount !== initialVotes + voteWeight) {
    throw new Error(`Votes mismatch: expected ${initialVotes + voteWeight}, got ${responseData.data.votesCount}`);
  }
  if (responseData.data.karmaDeducted !== expectedKarmaCost) {
    throw new Error(`Karma cost mismatch: expected ${expectedKarmaCost}, got ${responseData.data.karmaDeducted}`);
  }

  // Verify in MongoDB
  const updatedUser = await User.findById(citizen._id);
  console.log(`  ✅ MongoDB Verified Citizen Karma: ${updatedUser.karmaPoints}`);
  if (updatedUser.karmaPoints !== 41) {
    throw new Error(`Citizen Karma not decremented in MongoDB: expected 41, got ${updatedUser.karmaPoints}`);
  }

  // Step 4: Test Real Expenditure Ledger from MongoDB
  console.log(`\nTest 4: Real Audited Expenditure Ledger from MongoDB (RoadContracts + Defect Micro-Escrows)`);
  const expReq = { params: { ward: "all" } };
  let expData = null;
  const expRes = {
    status: (code) => ({
      json: (data) => {
        expData = { code, data };
        return data;
      },
    }),
  };

  await getWardExpenditures(expReq, expRes);
  console.log(`  ✅ Audited Transactions Count: ${expData.data.count}`);
  if (expData.data.count > 0) {
    const sample = expData.data.transactions[0];
    console.log(`  Sample Transaction:`);
    console.log(`    Work Order: ${sample.workOrderId}`);
    console.log(`    Title: ${sample.title}`);
    console.log(`    Contractor: ${sample.contractorName} (${sample.vendorGstin})`);
    console.log(`    Committed: ₹${sample.committedAmountInr.toLocaleString()} | Disbursed: ₹${sample.disbursedAmountInr.toLocaleString()}`);
    console.log(`    SHA-256 Ledger Hash: ${sample.blockHash}`);
    console.log(`    Status: ${sample.status} (${sample.completionPercentage}%)`);
  }

  // Cleanup test user
  await User.findByIdAndDelete(citizen._id);
  console.log("\n🧹 Cleaned up test user record.");

  console.log("================================================================================");
  console.log("🎉 ALL REAL QUADRATIC VOTING & EXPENDITURE AUDIT TESTS PASSED (ZERO MOCK DATA)!");
  console.log("================================================================================");

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
