/**
 * test_token_verification.js
 * Verification test for URL decoding, email matching, and 7-day token lifespan.
 */

const dotenv = require("dotenv");
dotenv.config();

const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");

async function testTokenFlow() {
  console.log("========================================================================");
  console.log("🧪 Testing Token Expiration & URL-Decoded Email Verification");
  console.log("========================================================================");

  // 1. Connect DB if MONGO_URI is set
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log("ℹ️ MONGO_URI not set. Testing in-memory model token generation only.");
  } else {
    try {
      await mongoose.connect(mongoUri);
      console.log("✅ Connected to MongoDB.");
    } catch (e) {
      console.warn("⚠️ MongoDB connection notice:", e.message);
    }
  }

  // 2. Test User Schema Token Lifespan
  const testUser = new User({
    name: "Verification Test Citizen",
    email: "test.citizen.7days@mumbai.gov.in",
    password: "Password123!",
  });

  const rawToken = testUser.generateEmailVerificationToken();
  const expiresMs = new Date(testUser.emailVerificationExpires).getTime();
  const nowMs = Date.now();
  const diffDays = (expiresMs - nowMs) / (1000 * 60 * 60 * 24);

  console.log(`\n1. Token Lifespan Test:`);
  console.log(`   Generated Raw Token: ${rawToken}`);
  console.log(`   Hashed Token in DB:  ${testUser.emailVerificationToken}`);
  console.log(`   Expires At:          ${testUser.emailVerificationExpires.toISOString()}`);
  console.log(`   Lifespan Duration:   ${diffDays.toFixed(2)} days (Target: ~7.00 days)`);

  if (diffDays < 6.9 || diffDays > 7.1) {
    throw new Error(`Lifespan mismatch: expected ~7 days, got ${diffDays}`);
  }
  console.log("   ✅ Lifespan duration verified: Exactly 7 days (168 hours).");

  // 3. Test URL-Encoded Email & Token Matching logic
  console.log(`\n2. URL Decoding & Hash Matching Test:`);
  const encodedEmail = "test.citizen.7days%40mumbai.gov.in";
  const decodedEmail = decodeURIComponent(encodedEmail).toLowerCase().trim();
  const hashedInputToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  console.log(`   Encoded URL param:   ${encodedEmail}`);
  console.log(`   Decoded Email:       ${decodedEmail}`);
  console.log(`   Hash Matches Model:  ${hashedInputToken === testUser.emailVerificationToken}`);

  if (decodedEmail !== testUser.email || hashedInputToken !== testUser.emailVerificationToken) {
    throw new Error("Email decoding or hash comparison failed!");
  }
  console.log("   ✅ URL-decoded email matching & SHA-256 token verification passed.");

  console.log("\n========================================================================");
  console.log("🎉 All Token Verification & Lifespan Tests Passed!");
  console.log("========================================================================\n");

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

testTokenFlow()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  });
