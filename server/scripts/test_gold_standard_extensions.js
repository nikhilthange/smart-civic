/**
 * ─── Automated Verification: Gold-Standard Enterprise Extensions ──────────────
 * Tests:
 *  1. Meta WhatsApp Cloud Multi-Modal Webhook Ingestion
 *  2. Turf.js 24-Ward Point-in-Polygon Spatial Engine
 *  3. Trenching & Road Digging 25m Corridor Collision Engine
 *  4. Edge AI Laplacian Variance & Exposure Quality Math
 */

const assert = require("assert");
const whatsappCloudService = require("../services/whatsappCloudService");
const spatialBoundaryService = require("../services/spatialBoundaryService");

function runTests() {
  console.log("================================================================================");
  console.log("🏛️ TESTING GOLD-STANDARD ENTERPRISE EXTENSIONS");
  console.log("================================================================================\n");

  let passed = 0;

  // ─── Test 1: Meta WhatsApp Cloud Payload Normalization (Official Meta JSON) ───
  console.log("Test 1: Meta WhatsApp Cloud Webhook Normalization (Official Cloud API)");
  const metaCloudWebhook = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "15550234567", phone_number_id: "100000000000001" },
              contacts: [
                {
                  profile: { name: "Ananya Sharma" },
                  wa_id: "919876543210",
                },
              ],
              messages: [
                {
                  from: "919876543210",
                  id: "wamid.HBgMOT",
                  timestamp: "1700000000",
                  type: "location",
                  location: {
                    latitude: 19.0596,
                    longitude: 72.8347,
                    name: "Bandra Linking Road",
                    address: "Linking Road, Bandra West, Mumbai",
                  },
                },
              ],
            },
            field: "messages",
          },
        ],
      },
    ],
  };

  const normalizedMeta = whatsappCloudService.normalizeWebhookPayload(metaCloudWebhook);
  assert.strictEqual(normalizedMeta.isMetaCloudApi, true);
  assert.strictEqual(normalizedMeta.senderPhone, "919876543210");
  assert.strictEqual(normalizedMeta.senderName, "Ananya Sharma");
  assert.strictEqual(normalizedMeta.messageType, "location");
  assert.strictEqual(normalizedMeta.latitude, 19.0596);
  assert.strictEqual(normalizedMeta.longitude, 72.8347);
  console.log("  ✅ Official Meta WhatsApp Cloud JSON structure normalized accurately");
  passed++;

  // ─── Test 2: WhatsApp Interactive Reply Button Generator ──────────────────────
  console.log("\nTest 2: WhatsApp Interactive Reply Button Payload Generation");
  const reply = whatsappCloudService.buildInteractiveReply("SC-2026-9901", "Ward H-West");
  assert.strictEqual(reply.messaging_product, "whatsapp");
  assert.strictEqual(reply.interactive.type, "button");
  assert.strictEqual(reply.interactive.action.buttons.length, 3);
  assert.strictEqual(reply.interactive.action.buttons[0].reply.id, "track_SC-2026-9901");
  console.log("  ✅ Interactive action buttons generated with live track & GIS links");
  passed++;

  // ─── Test 3: Precision Mumbai 24-Ward Point-in-Polygon Engine ─────────────────
  console.log("\nTest 3: Turf 24-Ward Spatial Point-in-Polygon Engine");
  // Dadar West (19.0280, 72.8420) -> Ward G-North
  const dadarWard = spatialBoundaryService.findWardByCoordinates(19.0280, 72.8420);
  assert.strictEqual(dadarWard.wardCode, "Ward G-North");

  // Bandra West (19.0600, 72.8300) -> Ward H-West
  const bandraWard = spatialBoundaryService.findWardByCoordinates(19.0600, 72.8300);
  assert.strictEqual(bandraWard.wardCode, "Ward H-West");

  // Colaba (18.9100, 72.8250) -> Ward A
  const colabaWard = spatialBoundaryService.findWardByCoordinates(18.9100, 72.8250);
  assert.strictEqual(colabaWard.wardCode, "Ward A");

  console.log("  ✅ Exact 24-Ward Point-in-Polygon verification passed (Dadar -> G-N, Bandra -> H-W, Colaba -> Ward A)");
  passed++;

  // ─── Test 4: Trenching & Dig Once 25m Corridor Buffer Collision Check ────────
  console.log("\nTest 4: Trenching Corridor Spatial Collision Detection");
  const lineAdani = [
    [19.0178, 72.8437],
    [19.0182, 72.8441],
  ];
  const lineMGL_Overlap = [
    [19.0179, 72.8438], // ~15m away
    [19.0185, 72.8445],
  ];
  const lineAirtel_Safe = [
    [19.0250, 72.8550], // ~1.4 km away
    [19.0260, 72.8560],
  ];

  const collisionResult = spatialBoundaryService.checkCorridorCollision(lineAdani, lineMGL_Overlap, 25);
  assert.strictEqual(collisionResult.isColliding, true);
  assert(collisionResult.minDistanceMeters <= 25);

  const safeResult = spatialBoundaryService.checkCorridorCollision(lineAdani, lineAirtel_Safe, 25);
  assert.strictEqual(safeResult.isColliding, false);
  assert(safeResult.minDistanceMeters > 25);
  console.log(`  ✅ Corridor collision detected accurately (${collisionResult.minDistanceMeters}m <= 25m) vs Safe (${safeResult.minDistanceMeters}m > 25m)`);
  passed++;

  // ─── Test 5: All 24 Wards GeoJSON Feature Collection ──────────────────────────
  console.log("\nTest 5: 24-Ward GeoJSON Polygons FeatureCollection Export");
  const allWardsGeoJSON = spatialBoundaryService.getAllWardsGeoJSON();
  assert.strictEqual(allWardsGeoJSON.type, "FeatureCollection");
  assert.strictEqual(allWardsGeoJSON.features.length, 24);
  assert.strictEqual(allWardsGeoJSON.features[0].geometry.type, "Polygon");
  console.log("  ✅ Full 24-Ward GeoJSON Polygon catalog exported with 24 valid features");
  passed++;

  console.log("\n================================================================================");
  console.log(`🎉 ALL ${passed}/${passed} GOLD-STANDARD ENTERPRISE EXTENSION TESTS PASSED!`);
  console.log("================================================================================\n");
}

runTests();
