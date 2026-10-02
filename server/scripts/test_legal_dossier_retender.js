"use strict";

const mongoose = require("mongoose");
require("dotenv").config();
const Complaint = require("../models/Complaint");
const ContractorScorecard = require("../models/ContractorScorecard");
const ContractorMicroEscrow = require("../models/ContractorMicroEscrow");
const RtsStatutoryPenalty = require("../models/RtsStatutoryPenalty");
const legalDossierService = require("../services/legalDossierService");
const contractorMicroEscrowService = require("../services/contractorMicroEscrowService");
const rtsEnforcementService = require("../services/rtsEnforcementService");

async function runTestSuite() {
  console.log("================================================================================");
  console.log("⚡ TEST SUITE: HIGH COURT PIL DOSSIER (SEC 65B) & AUTONOMOUS RETENDERING ENGINE");
  console.log("================================================================================");

  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/smart-civic";
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to Real MongoDB:", mongoose.connection.name);

  // Initialize seed data if needed
  await contractorMicroEscrowService.ensureSeedData();
  await rtsEnforcementService.ensureSeedData();

  // Test 1: Query an existing complaint
  console.log("\n▶ TEST 1: Retrieve Live Municipal Complaint Record...");
  let complaint = await Complaint.findOne({ status: { $ne: "resolved" } }).lean();
  if (!complaint) {
    complaint = await Complaint.findOne().lean();
  }

  if (!complaint) {
    throw new Error("No complaints found in MongoDB to test evidentiary dossier.");
  }
  console.log(`Found Complaint: ${complaint.complaintId} | Title: "${complaint.title}" | Ward: ${complaint.ward}`);

  // Test 2: Generate Court-Admissible Dossier under Indian Evidence Act Sec 65B
  console.log("\n▶ TEST 2: Generate Indian Evidence Act Sec 65B Electronic Evidentiary Dossier...");
  const dossier = await legalDossierService.generateEvidentiaryDossier(complaint.complaintId || complaint._id);

  if (!dossier || !dossier.success) {
    throw new Error("Failed to generate legal dossier.");
  }

  console.log(`✅ Dossier Generated: ${dossier.dossierId}`);
  console.log(`✅ Sec 65B Certificate Number: ${dossier.section65BCertificate.certificateNumber}`);
  console.log(`✅ Cryptographic SHA-256 Fingerprint: ${dossier.section65BCertificate.digitalFingerprintSha256}`);
  console.log(`✅ Chain of Custody Events Logged: ${dossier.chainOfCustody.length} checkpoints`);

  if (!dossier.section65BCertificate.digitalFingerprintSha256 || dossier.section65BCertificate.digitalFingerprintSha256.length !== 64) {
    throw new Error("Invalid SHA-256 fingerprint on Section 65B Certificate.");
  }

  // Test 3: Validate High Court PIL Pleadings & RTI Requisition
  console.log("\n▶ TEST 3: Validate High Court PIL Pleading & RTI 2005 Requisitions...");
  const pil = dossier.highCourtPilDraft;
  console.log(`✅ Forum: ${pil.forum}`);
  console.log(`✅ Cause Title: ${pil.causeTitle}`);
  console.log(`✅ Grounds of Law: ${pil.statutoryGrounds.length} constitutional & statutory grounds`);
  console.log(`✅ Prayer Clauses: ${pil.prayerClauses.length} judicial remedies requested`);

  const rti = dossier.rtiSection6Application;
  console.log(`✅ RTI Addressed To: ${rti.addressedTo}`);
  console.log(`✅ RTI Specific Requisitions: ${rti.requisitions.length} queries to PIO`);

  if (pil.prayerClauses.length < 2 || rti.requisitions.length < 3) {
    throw new Error("Pleadings or RTI questions incomplete.");
  }

  // Test 4: Execute Autonomous Emergency Re-Tendering & Collateral Forfeiture
  console.log("\n▶ TEST 4: Execute Autonomous Contractor Re-Tendering & Emergency SLA Reset...");
  const complaintIdentifier = complaint.complaintId || String(complaint._id);
  const retenderResult = await legalDossierService.executeEmergencyRetender({
    complaintId: complaintIdentifier,
    authorizingOfficer: "Dr. Sanjay Mukherjee, IAS (Municipal Commissioner Special Vigilance)",
  });

  if (!retenderResult || !retenderResult.success) {
    throw new Error("Failed to execute emergency retender.");
  }

  const receipt = retenderResult.retenderReceipt;
  console.log(`✅ Re-Tender Transaction: ${receipt.receiptNumber}`);
  console.log(`✅ Forfeited Delinquent Contractor: ${receipt.forfeitedContractor} (Forfeited ₹${receipt.forfeitedAmountInr})`);
  console.log(`✅ Awarded Grade-A Contractor: ${receipt.awardedContractor.companyName} (Reliability: ${receipt.awardedContractor.reliabilityScore}%)`);
  console.log(`✅ Expedited Emergency SLA: ${receipt.expeditedSlaHours} Hours (Deadline: ${receipt.expeditedSlaDeadline})`);
  console.log(`✅ Transaction Hash (SHA-256): ${receipt.transactionHashSha256}`);

  // Verify complaint state updated in DB
  const updatedComplaint = await Complaint.findById(complaint._id).lean();
  console.log(`✅ Verified in DB: Complaint status is '${updatedComplaint.status}', contractor is '${updatedComplaint.assignedContractor?.name}'`);

  if (updatedComplaint.status !== "in_progress" || updatedComplaint.assignedContractor?.name !== receipt.awardedContractor.companyName) {
    throw new Error("Complaint document was not correctly updated in MongoDB.");
  }

  // Test 5: Ward-Wide Systemic Delinquency Class-Action Dossier
  console.log("\n▶ TEST 5: Generate Ward-Wide Systemic Delinquency Dossier...");
  const wardDossier = await legalDossierService.generateWardSystemicDossier(complaint.ward || "Ward H-West");
  console.log(`✅ Ward Audit: ${wardDossier.ward}`);
  console.log(`✅ Total Complaints: ${wardDossier.summary.totalComplaintsLogged}`);
  console.log(`✅ Chronic Breaches: ${wardDossier.summary.chronicBreachedComplaints}`);
  console.log(`✅ Total Officer RTS Penalties: ₹${wardDossier.summary.totalOfficerRtsPenaltiesInr}`);
  console.log(`✅ Total Contractor Slashed Collateral: ₹${wardDossier.summary.totalContractorEscrowSlashedInr}`);
  console.log(`✅ Aggregate Public Dividend Recoverable: ₹${wardDossier.summary.aggregatePublicDividendRecoverableInr}`);
  console.log(`✅ Systemic Fingerprint SHA-256: ${wardDossier.systemicFingerprintSha256}`);

  console.log("\n================================================================================");
  console.log("🎉 ALL 5 LEGAL EVIDENTIARY DOSSIER & RETENDERING TESTS PASSED AGAINST REAL MONGO");
  console.log("================================================================================");

  await mongoose.disconnect();
}

runTestSuite().catch(err => {
  console.error("❌ TEST RUNNER FAILED:", err);
  process.exit(1);
});
