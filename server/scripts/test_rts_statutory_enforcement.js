"use strict";

const mongoose = require("mongoose");
require("dotenv").config();
const RtsStatutoryPenalty = require("../models/RtsStatutoryPenalty");
const User = require("../models/User");
const rtsEnforcementService = require("../services/rtsEnforcementService");

async function runRtsTests() {
  console.log("================================================================================");
  console.log("⚖️ TESTING REAL MAHARASHTRA RTS ACT 2015 STATUTORY ENFORCEMENT & SALARY DEDUCTION");
  console.log("================================================================================");

  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/smart-civic");
  console.log("✅ MongoDB Connected");

  // Step 1: Test RTS Summary Aggregation from MongoDB
  console.log("\n[Test 1] Testing RTS Global & Ward Summary Aggregation...");
  const summary = await rtsEnforcementService.getRtsSummary();
  console.log(`  ✅ Total Notices Assessed: ${summary.global.totalNotices}`);
  console.log(`  ✅ Total Salary Deducted Enforced: ₹${summary.global.totalSalaryDeductedInr.toLocaleString()}`);
  console.log(`  ✅ Total Citizen Compensation Disbursed: ₹${summary.global.totalCitizenCompensationDisbursedInr.toLocaleString()}`);
  console.log(`  ✅ Wards Tracked: ${summary.wardBreakdown.length} Wards`);

  // Step 2: Create a real test citizen in MongoDB
  const testCitizen = await User.create({
    name: "Smt. Rohini Kamble",
    email: `citizen_rts_${Date.now()}@mumbai.gov.in`,
    password: "Password@123",
    role: "citizen",
    ward: "Ward G-North",
    karmaPoints: 10,
  });
  console.log(`\n[Test 2] Created Real Complainant Citizen (Initial Karma: ${testCitizen.karmaPoints})`);

  // Step 3: Issue Statutory Show-Cause Notice under Section 10
  console.log("\n[Test 3] Issuing Section 10 Statutory Notice for 3-Day SLA Breach...");
  const notice = await rtsEnforcementService.issueStatutoryNotice({
    complaintId: `SC-2026-RTS-${Date.now().toString().slice(-4)}`,
    complaintTitle: "Delayed Pothole Patching on Senapati Bapat Marg",
    ward: "Ward G-North",
    category: "roads_and_infrastructure",
    officerEmployeeId: "BMC-EE-9901",
    officerName: "Shri. Sunil Gavankar",
    officerDesignation: "Executive Engineer (EE)",
    officerDepartment: "PWD",
    complainantCitizenId: testCitizen._id.toString(),
    complainantName: testCitizen.name,
    complainantEmail: testCitizen.email,
    statutoryTimeLimitHours: 24,
    elapsedHours: 96, // 72h overdue = 3 days delay
  });

  console.log(`  ✅ Generated Notice Number: ${notice.noticeNumber}`);
  console.log(`  ✅ Delay Days: ${notice.delayDays} day(s)`);
  console.log(`  ✅ Statutory Penalty: ₹${notice.totalPenaltyAmountInr} (Expected: 3 * 250 = ₹750)`);
  console.log(`  ✅ Digital Notice Hash: ${notice.legalNoticeHash}`);
  console.log(`  ✅ Status: ${notice.status}`);

  if (notice.totalPenaltyAmountInr !== 750) {
    throw new Error(`Expected penalty ₹750, got ₹${notice.totalPenaltyAmountInr}`);
  }

  // Step 4: First Appellate Authority Adjudication (Salary Deduction Enforced)
  console.log("\n[Test 4] First Appellate Authority Adjudicating Notice (Enforcing Salary Deduction)...");
  const adjudicated = await rtsEnforcementService.adjudicatePenalty(
    notice.noticeNumber,
    "SALARY_DEDUCTION_ENFORCED",
    "Section 10 violation upheld. ₹750 to be debited from officer monthly salary account."
  );

  console.log(`  ✅ Adjudicated Status: ${adjudicated.status}`);
  console.log(`  ✅ Adjudication Note: ${adjudicated.adjudicationNote}`);
  console.log(`  ✅ Adjudicated By: ${adjudicated.adjudicatedBy}`);

  if (adjudicated.status !== "SALARY_DEDUCTION_ENFORCED") {
    throw new Error("Adjudication failed to update status to SALARY_DEDUCTION_ENFORCED");
  }

  // Step 5: Disburse Statutory Delay Compensation to Citizen
  console.log("\n[Test 5] Disbursing Citizen Delay Compensation Dividend...");
  const compensated = await rtsEnforcementService.compensateAggrievedCitizen(notice.noticeNumber);
  console.log(`  ✅ Compensation Status: ${compensated.status}`);
  console.log(`  ✅ Citizen Compensation Paid: ₹${compensated.citizenCompensationPaidInr}`);
  console.log(`  ✅ Statutory Voucher: ${compensated.citizenCompensationVoucher}`);

  // Verify Citizen received Karma bonus in MongoDB
  const updatedCitizen = await User.findById(testCitizen._id);
  console.log(`  ✅ Updated Citizen Karma Balance: ${updatedCitizen.karmaPoints} (Expected: 10 + 75 = 85)`);

  if (updatedCitizen.karmaPoints !== 85) {
    throw new Error(`Citizen Karma mismatch: expected 85, got ${updatedCitizen.karmaPoints}`);
  }

  // Cleanup test citizen and test notice
  await User.findByIdAndDelete(testCitizen._id);
  await RtsStatutoryPenalty.findByIdAndDelete(notice._id);
  console.log("\n🧹 Cleaned up temporary test artifacts.");

  console.log("================================================================================");
  console.log("🎉 ALL REAL MAHARASHTRA RTS STATUTORY ENFORCEMENT TESTS PASSED (ZERO MOCK DATA)!");
  console.log("================================================================================");

  await mongoose.disconnect();
}

runRtsTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
