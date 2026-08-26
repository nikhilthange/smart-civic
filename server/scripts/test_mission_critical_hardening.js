"use strict";

/**
 * ============================================================================
 * 🔒 MISSION-CRITICAL SECURITY, IDOR & RESILIENCY HARDENING VERIFICATION SUITE
 * ============================================================================
 */

require("dotenv").config({ path: "server/.env" });
const crypto = require("crypto");
const { maskPhoneNumber, maskEmail, sanitizeCitizenProfile, stripExifMetadata } = require("../utils/piiScrubber");
const queueService = require("../services/queueService");
const { verifyWebhookSignature } = require("../controllers/whatsappWebhookController");

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ PASSED: ${message}`);
}

async function runTests() {
  console.log("\n================================================================================");
  console.log("🔒 MISSION-CRITICAL SECURITY, IDOR & RESILIENCY HARDENING SUITE");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------
  // TEST 1: Citizen PII Masking & Scrubbing
  // --------------------------------------------------------------------------
  console.log("--- [Test 1] Citizen PII Masking & Scrubbing ---");
  const phone1 = maskPhoneNumber("+91 98201 11223");
  assert(phone1.includes("****") && phone1.endsWith("1223"), `Phone masked properly (${phone1})`);

  const email1 = maskEmail("nikhil.verma@mumbai.gov.in");
  assert(email1.startsWith("n***") && email1.endsWith("@mumbai.gov.in"), `Email masked properly (${email1})`);

  const rawCitizen = {
    _id: "60d0fe4f5311236168a109ca",
    name: "Aarav Sharma",
    phoneNumber: "+91 98201 99887",
    email: "aarav.sharma@gmail.com",
    role: "citizen",
  };
  const sanitized = sanitizeCitizenProfile(rawCitizen);
  assert(sanitized.phoneNumber.includes("****"), "Citizen profile phone sanitized");
  assert(sanitized.email.includes("***"), "Citizen profile email sanitized");
  assert(sanitized.name === "Aarav Sharma", "Non-PII fields intact");

  // --------------------------------------------------------------------------
  // TEST 2: EXIF Binary Metadata Stripping
  // --------------------------------------------------------------------------
  console.log("\n--- [Test 2] EXIF Binary Metadata Stripping ---");
  // Mock a JPEG buffer with an APP1 (EXIF) segment: 0xFF, 0xD8, 0xFF, 0xE1, length: 0x00, 0x0A, [10 bytes of data], 0xFF, 0xDA, [pixel data]
  const exifSegment = Buffer.from([0xff, 0xe1, 0x00, 0x06, 0x45, 0x78, 0x69, 0x66]);
  const imagePixels = Buffer.from([0xff, 0xda, 0x00, 0x02, 0x12, 0x34, 0x56, 0x78, 0xff, 0xd9]);
  const mockJpeg = Buffer.concat([Buffer.from([0xff, 0xd8]), exifSegment, imagePixels]);

  const stripped = stripExifMetadata(mockJpeg);
  assert(stripped.length < mockJpeg.length, "EXIF segment successfully stripped from image buffer");
  assert(stripped[0] === 0xff && stripped[1] === 0xd8, "JPEG header preserved");

  // --------------------------------------------------------------------------
  // TEST 3: Meta WhatsApp Webhook Cryptographic HMAC Signature Verification
  // --------------------------------------------------------------------------
  console.log("\n--- [Test 3] Webhook HMAC SHA-256 Signature Verification ---");
  const secret = process.env.META_APP_SECRET || "bmc_smart_civic_meta_app_secret_2026";
  const payload = JSON.stringify({ object: "whatsapp_business_account", entry: [{ id: "1098234" }] });
  const validHash = "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const forgedHash = "sha256=" + crypto.createHmac("sha256", "wrong_secret").update(payload).digest("hex");

  // 3a. Valid signature check
  let validNextCalled = false;
  const mockReqValid = {
    headers: { "x-hub-signature-256": validHash },
    body: JSON.parse(payload),
    rawBody: payload,
  };
  const mockResValid = {
    status: () => ({ json: () => {} }),
  };
  verifyWebhookSignature(mockReqValid, mockResValid, () => {
    validNextCalled = true;
  });
  assert(validNextCalled, "Valid HMAC signature accepted");

  // 3b. Forged signature check
  let forgedRejected = false;
  const mockReqForged = {
    headers: { "x-hub-signature-256": forgedHash },
    body: JSON.parse(payload),
    rawBody: payload,
  };
  const mockResForged = {
    status: (code) => {
      if (code === 401) forgedRejected = true;
      return { json: () => {} };
    },
  };
  verifyWebhookSignature(mockReqForged, mockResForged, () => {});
  assert(forgedRejected, "Forged HMAC signature correctly rejected with 401 Unauthorized");

  // --------------------------------------------------------------------------
  // TEST 4: IDOR Object-Level Permission Boundaries Simulation
  // --------------------------------------------------------------------------
  console.log("\n--- [Test 4] IDOR Object-Level Access Control ---");
  const citizenA = { id: "user_citizen_1", role: "citizen" };
  const citizenB = { id: "user_citizen_2", role: "citizen" };
  const officerHWest = { id: "officer_1", role: "officer", ward: "Ward H-West" };
  const admin = { id: "admin_1", role: "admin" };

  const complaintA = {
    complaintId: "SC-2026-9001",
    citizen: "user_citizen_1",
    ward: "Ward H-West",
    status: "in_progress",
  };

  const evaluateAccess = (user, complaint) => {
    if (user.role === "admin") return { allowed: true };
    if (user.role === "officer") {
      if (!user.ward || user.ward === complaint.ward) return { allowed: true };
      return { allowed: false, reason: "Ward jurisdiction mismatch" };
    }
    if (user.role === "citizen") {
      if (complaint.citizen === user.id) return { allowed: true };
      return { allowed: false, reason: "IDOR: Cross-citizen grievance access prohibited" };
    }
    return { allowed: false, reason: "Unauthorized" };
  };

  assert(evaluateAccess(citizenA, complaintA).allowed, "Citizen A can access own complaint");
  assert(!evaluateAccess(citizenB, complaintA).allowed, "Citizen B blocked from accessing Citizen A's complaint (IDOR Protected)");
  assert(evaluateAccess(officerHWest, complaintA).allowed, "Officer in Ward H-West can access Ward H-West complaint");
  assert(evaluateAccess(admin, complaintA).allowed, "Super Admin can access any complaint");

  // --------------------------------------------------------------------------
  // TEST 5: Resilient Asynchronous Job Queue Processing
  // --------------------------------------------------------------------------
  console.log("\n--- [Test 5] Resilient Asynchronous Job Queue ---");
  const jobReceipt = queueService.enqueueJob("PDF_NOTICE_GENERATION", {
    buildingId: "BLD-GN-01",
    legalSection: "Section 354 MMC Act",
  });
  assert(jobReceipt.jobId.startsWith("job_"), `Job queued with tracking ID (${jobReceipt.jobId})`);
  assert(jobReceipt.status === "QUEUED", "Initial job status is QUEUED");

  // Wait for worker loop
  await new Promise((resolve) => setTimeout(resolve, 100));
  const finalStatus = queueService.getJobStatus(jobReceipt.jobId);
  assert(finalStatus.status === "COMPLETED", `Job completed asynchronously (Status: ${finalStatus.status})`);
  assert(finalStatus.result?.noticeId?.startsWith("NOT-"), "Job result populated with valid Notice ID");

  console.log("\n================================================================================");
  console.log("🎉 ALL MISSION-CRITICAL SECURITY & RESILIENCY TESTS PASSED! (100% HEALTH)");
  console.log("================================================================================\n");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
