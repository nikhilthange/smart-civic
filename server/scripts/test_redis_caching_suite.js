"use strict";

const assert = require("assert");
const redisManager = require("../config/redis");
const { cacheMiddleware, invalidateCache, clearAllCache } = require("../middlewares/cacheMiddleware");
const civicKarmaService = require("../services/civicKarmaService");
const { protect } = require("../middlewares/auth");
const { handleIncomingMessage } = require("../controllers/whatsappWebhookController");
const jwt = require("jsonwebtoken");

async function runRedisTests() {
  console.log("================================================================================");
  console.log("🚀 TESTING REDIS CACHING, LEADERBOARDS, BLACKLISTING & DEDUPLICATION");
  console.log("================================================================================\n");

  // 1. Basic Key-Value & TTL
  console.log("▶ [Test 1] Redis SetEx / Get / Del Key-Value Operations...");
  await redisManager.setEx("test:ping", 10, { msg: "pong" });
  const rawVal = await redisManager.get("test:ping");
  const parsed = JSON.parse(rawVal);
  assert.strictEqual(parsed.msg, "pong", "Value should match");
  await redisManager.del("test:ping");
  const afterDel = await redisManager.get("test:ping");
  assert.strictEqual(afterDel, null, "Key should be deleted");
  console.log("  ✅ PASSED: Basic Redis Key-Value & TTL operations verified");

  // 2. HTTP Cache Middleware & Distributed Invalidation
  console.log("\n▶ [Test 2] Cache Middleware & Pattern Invalidation...");
  clearAllCache();
  const req = { method: "GET", originalUrl: "/api/cctv/cameras", user: null, params: {} };
  let capturedData = null;
  let headers = {};
  const res = {
    headersSent: false,
    setHeader: (k, v) => { headers[k] = v; },
    statusCode: 200,
    json: (data) => { capturedData = data; return res; },
    status: (code) => { res.statusCode = code; return res; },
  };

  const middleware = cacheMiddleware(10);
  let nextCalled = false;
  await middleware(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true, "First request should proceed to handler");

  // Simulate route handler calling res.json
  res.json({ cameras: [1, 2, 3] });
  assert.strictEqual(headers["X-Cache"], "MISS", "First call is a MISS");

  // Second request should HIT
  let secondHit = false;
  const res2 = {
    headersSent: false,
    setHeader: (k, v) => { headers[k] = v; },
    statusCode: 200,
    status: (code) => { res2.statusCode = code; return res2; },
    json: (data) => {
      secondHit = true;
      assert.deepStrictEqual(data, { cameras: [1, 2, 3] });
      return res2;
    },
  };
  await middleware(req, res2, () => {});
  assert.strictEqual(secondHit, true, "Second call should return cached payload");
  assert.strictEqual(headers["X-Cache"], "HIT", "Second call is a HIT");

  // Pattern Invalidation
  invalidateCache("cctv");
  const valAfterInvalidate = await redisManager.get("cache:public:public:/api/cctv/cameras");
  assert.strictEqual(valAfterInvalidate, null, "Cache key should be invalidated");
  console.log("  ✅ PASSED: CacheMiddleware & Pattern Invalidation verified");

  // 3. Civic Karma Redis Sorted Sets
  console.log("\n▶ [Test 3] Civic Karma Real-time Sorted Sets Leaderboards...");
  await redisManager.zAdd("leaderboard:all", "user_1|Aarav Sharma|Ward A", 1200);
  await redisManager.zAdd("leaderboard:all", "user_2|Pooja Mehta|Ward B", 950);
  await redisManager.zAdd("leaderboard:all", "user_3|Rohan K|Ward A", 700);

  const topAll = await civicKarmaService.getWardLeaderboard("all");
  assert.strictEqual(topAll[0].name, "Aarav Sharma");
  assert.strictEqual(topAll[0].rank, 1);
  assert.strictEqual(topAll[0].tierBadge, "CIVIC_HERO");
  console.log("  ✅ PASSED: Redis Sorted Sets leaderboard ranking verified");

  // 4. Token Blacklisting & Session Revocation
  console.log("\n▶ [Test 4] Token Blacklisting & Fast Redis Revocation Check...");
  process.env.JWT_SECRET = "test_jwt_secret_key_12345";
  const dummyToken = jwt.sign({ id: "mock_user_123" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const crypto = require("crypto");
  const tokenHash = crypto.createHash("sha256").update(dummyToken).digest("hex");

  // Add to Redis blacklist
  await redisManager.setEx(`blacklist:${tokenHash}`, 3600, "1");

  const authReq = {
    headers: { authorization: `Bearer ${dummyToken}` },
  };
  let authStatus = 200;
  let authMessage = "";
  const authRes = {
    status: (code) => {
      authStatus = code;
      return {
        json: (body) => { authMessage = body.message; },
      };
    },
  };
  await protect(authReq, authRes, () => {});
  assert.strictEqual(authStatus, 401, "Blacklisted token should return 401");
  assert(authMessage.includes("invalidated"), "Message should mention token invalidated");
  console.log("  ✅ PASSED: Redis fast token blacklist revocation verified");

  // 5. WhatsApp & Webhook Deduplication
  console.log("\n▶ [Test 5] Webhook Atomic Deduplication (SETNX)...");
  const webhookReq1 = {
    body: {
      entry: [{
        changes: [{
          value: {
            messages: [{ id: "wamid.HBgLMTIzNDU2", from: "919876543210", text: { body: "Pothole on Linking Road" } }],
          },
        }],
      }],
    },
  };
  let webhookRes1Data = null;
  const webhookRes1 = {
    status: () => ({
      json: (data) => { webhookRes1Data = data; },
    }),
  };

  await handleIncomingMessage(webhookReq1, webhookRes1);
  assert.strictEqual(webhookRes1Data.success, true);
  assert.strictEqual(webhookRes1Data.deduplicated, undefined);

  // Send duplicate payload with same wamid
  let webhookRes2Data = null;
  const webhookRes2 = {
    status: () => ({
      json: (data) => { webhookRes2Data = data; },
    }),
  };
  await handleIncomingMessage(webhookReq1, webhookRes2);
  assert.strictEqual(webhookRes2Data.success, true);
  assert.strictEqual(webhookRes2Data.deduplicated, true, "Duplicate delivery should be recognized and dropped");
  console.log("  ✅ PASSED: Atomic webhook message deduplication verified");

  console.log("\n================================================================================");
  console.log("🎉 ALL REDIS & CACHING INTEGRATION TESTS PASSED CLEANLY!");
  console.log("================================================================================\n");
}

runRedisTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
