/**
 * test_email_dispatch.js
 * Standalone test script to verify SMTP configuration and test email dispatch pipeline.
 */

const dotenv = require("dotenv");
dotenv.config();

const emailService = require("../services/emailService");

async function runTest() {
  console.log("========================================================================");
  console.log("🏛️  Smart Civic AI — Email Delivery & Verification Diagnostics");
  console.log("========================================================================");

  console.log("1. Checking Environment Variables...");
  console.log(`   NODE_ENV:      ${process.env.NODE_ENV || "development"}`);
  console.log(`   SMTP_HOST:     ${process.env.SMTP_HOST || "(not set)"}`);
  console.log(`   SMTP_PORT:     ${process.env.SMTP_PORT || "(not set)"}`);
  console.log(`   SMTP_USER:     ${process.env.SMTP_USER || process.env.EMAIL_USER || "(not set)"}`);
  console.log(`   SMTP_SECURE:   ${process.env.SMTP_SECURE || "(default)"}`);
  console.log(`   CLIENT_URL:    ${process.env.CLIENT_URL || "https://smart-civic-pi.vercel.app"}`);

  console.log("\n2. Testing Transporter Connection...");
  const connResult = await emailService.verifyConnection();
  console.log("   Connection Status:", JSON.stringify(connResult, null, 2));

  console.log("\n3. Testing Verification Email Generation & Dispatch...");
  const testRecipient = process.env.TEST_EMAIL || "citizen.test@smartcivic.mumbai.gov.in";
  const testToken = "test_verification_token_" + Date.now();

  try {
    const result = await emailService.sendVerificationEmail({
      email: testRecipient,
      name: "Aarav Deshmukh (Test Citizen)",
      verificationToken: testToken,
      clientUrl: "https://smart-civic-pi.vercel.app",
    });

    console.log("   Dispatch Result:", JSON.stringify(result, null, 2));
    console.log("\n✅ Email Delivery Pipeline Test Passed!");
  } catch (err) {
    console.error("❌ Email Dispatch Error:", err.message);
    process.exit(1);
  }

  console.log("========================================================================\n");
}

runTest().then(() => process.exit(0)).catch((err) => {
  console.error("Test execution failure:", err);
  process.exit(1);
});
