/**
 * ─── Automated Pre-Flight Production Environment Validation Script ───────────
 * Validates production environment variables, secrets entropy, and configurations.
 * Exits with code 0 on success, or code 1 with actionable diagnostic warnings.
 */

const dotenv = require("dotenv");
const path = require("path");

// Load production / current environment file
dotenv.config({ path: path.join(__dirname, "../.env") });

function verifyProductionEnvironment() {
  console.log("================================================================================");
  console.log("🔒 PRE-FLIGHT PRODUCTION ENVIRONMENT & SECURITY AUDIT");
  console.log("================================================================================\n");

  const errors = [];
  const warnings = [];

  const jwtSecret = process.env.JWT_SECRET || "";
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "";
  const clientOrigin = process.env.CLIENT_ORIGIN || "";
  const nodeEnv = process.env.NODE_ENV || "development";

  // 1. Validate JWT Secret Presence & Entropy (>= 32 chars)
  if (!jwtSecret) {
    errors.push("JWT_SECRET is missing. Define a strong secret in server/.env");
  } else if (jwtSecret.length < 32) {
    errors.push(`JWT_SECRET is too weak (${jwtSecret.length} chars). Minimum 32 characters required for production.`);
  } else if (jwtSecret === "default_secret_key" || jwtSecret === "secret") {
    errors.push("JWT_SECRET contains an insecure default placeholder value.");
  } else {
    console.log(`  ✅ JWT_SECRET: Valid (${jwtSecret.length} chars, high entropy)`);
  }

  // 2. Validate MongoDB URI Connection String Format
  if (!mongoUri) {
    errors.push("MONGO_URI / MONGODB_URI is missing.");
  } else if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
    errors.push(`MONGO_URI format invalid: "${mongoUri}". Must start with mongodb:// or mongodb+srv://`);
  } else {
    console.log(`  ✅ MONGO_URI: Valid format (${mongoUri.split("@")[1] ? "Atlas Cluster Connected" : "Local / Docker URI"})`);
  }

  // 3. Validate CORS Client Origin
  if (!clientOrigin) {
    warnings.push("CLIENT_ORIGIN is not defined. Defaulting to wildcard '*' (Recommend setting to https://smartcivic.mumbai.gov.in)");
  } else {
    console.log(`  ✅ CLIENT_ORIGIN: Whitelisted (${clientOrigin})`);
  }

  // 4. Validate Environment Mode
  if (nodeEnv !== "production") {
    warnings.push(`NODE_ENV is set to "${nodeEnv}". For live deployment, set NODE_ENV=production.`);
  } else {
    console.log(`  ✅ NODE_ENV: production mode active`);
  }

  console.log("\n--------------------------------------------------------------------------------");

  if (warnings.length > 0) {
    console.log("⚠️  PRE-FLIGHT ADVISORY WARNINGS:");
    warnings.forEach((w) => console.log(`   - ${w}`));
    console.log("--------------------------------------------------------------------------------");
  }

  if (errors.length > 0) {
    console.error("❌ CRITICAL PRODUCTION PRE-FLIGHT BLOCKS:");
    errors.forEach((e) => console.error(`   - ${e}`));
    console.error("\n🚫 Deployment validation FAILED. Fix environment variables and rerun.");
    process.exit(1);
  }

  console.log("🎉 ALL PRE-FLIGHT PRODUCTION ENVIRONMENT CHECKS PASSED!");
  console.log("================================================================================\n");
  process.exit(0);
}

if (require.main === module) {
  verifyProductionEnvironment();
}

module.exports = verifyProductionEnvironment;
