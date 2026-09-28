"use strict";

const assert = require("assert");
const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
let ClientIO;
try {
  ClientIO = require("socket.io-client").io;
} catch {
  ClientIO = require(path.resolve(__dirname, "../../frontend/node_modules/socket.io-client")).io;
}
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { initSocket, notifyUser } = require("../services/socketService");
const notificationRoutes = require("../routes/notificationRoutes");
const Notification = require("../models/Notification");
const User = require("../models/User");
const notificationService = require("../services/notificationService");

async function testNotificationSystem() {
  console.log("================================================================================");
  console.log("🔔 TESTING NOTIFICATION SYSTEM & REAL-TIME WEBSOCKET SUBSCRIPTIONS");
  console.log("================================================================================\n");

  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart_civic_test";
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log("  ✅ Connected to MongoDB");

  // Setup express test app with HTTP server and Socket.IO
  const app = express();
  app.use(express.json());

  // Mount notification routes
  app.use("/api/notifications", notificationRoutes);

  const server = http.createServer(app);
  initSocket(server);

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`  ✅ Test Server listening on ${baseUrl}`);

  // Create or retrieve a test user
  let testUser = await User.findOne({ email: "test.notification.user@mumbai.gov.in" });
  if (!testUser) {
    testUser = await User.create({
      name: "Notification Test Citizen",
      email: "test.notification.user@mumbai.gov.in",
      password: "TestPassword123!",
      role: "citizen",
      ward: "Ward H-West",
    });
  }

  const jwtSecret = process.env.JWT_SECRET || "ci_production_grade_jwt_secret_2026";
  const userToken = jwt.sign(
    { id: testUser._id.toString(), role: testUser.role, email: testUser.email },
    jwtSecret,
    { expiresIn: "1h" }
  );

  const axios = require("axios");
  const authHeaders = { headers: { Authorization: `Bearer ${userToken}` } };

  try {
    // ─── Test 1: Notification Creation & Persistence ────────────────────────────
    console.log("\n▶ [Test 1] Testing Notification Creation & Persistence...");
    await Notification.deleteMany({ recipient: testUser._id });

    const createdNotif = await notificationService.send({
      recipientId: testUser._id.toString(),
      type: "complaint_status_update",
      title: "Pothole Repair Work Scheduled",
      message: "Jetpatcher crew assigned to Link Road for overnight pothole repair.",
      actionUrl: "/track/SC-2026-TESTNOTIF",
    });

    assert(createdNotif, "Notification object must be returned");
    const foundInDb = await Notification.findById(createdNotif._id);
    assert.strictEqual(foundInDb.title, "Pothole Repair Work Scheduled");
    assert.strictEqual(foundInDb.isRead, false);
    console.log("  ✅ In-app Notification persisted in database with isRead: false");

    // ─── Test 2: Fetching Notifications Feed & Unread Count ─────────────────────
    console.log("\n▶ [Test 2] Testing GET /api/notifications API...");
    const feedRes = await axios.get(`${baseUrl}/api/notifications`, authHeaders);
    assert.strictEqual(feedRes.status, 200);
    assert.strictEqual(feedRes.data.success, true);
    assert(feedRes.data.notifications.length >= 1);
    assert(feedRes.data.unreadCount >= 1);
    console.log(`  ✅ Successfully fetched notifications (Count: ${feedRes.data.notifications.length}, Unread: ${feedRes.data.unreadCount})`);

    // ─── Test 3: Mark Individual Notification As Read ───────────────────────────
    console.log("\n▶ [Test 3] Testing PATCH /api/notifications/:id/read API...");
    const readRes = await axios.patch(`${baseUrl}/api/notifications/${createdNotif._id}/read`, {}, authHeaders);
    assert.strictEqual(readRes.status, 200);
    assert.strictEqual(readRes.data.notification.isRead, true);

    const recheckRes = await axios.get(`${baseUrl}/api/notifications`, authHeaders);
    assert.strictEqual(recheckRes.data.unreadCount, 0);
    console.log("  ✅ Individual notification marked as read, unreadCount decremented to 0");

    // ─── Test 4: Mark All As Read API ───────────────────────────────────────────
    console.log("\n▶ [Test 4] Testing PATCH /api/notifications/read-all API...");
    // Seed 2 more unread notifications
    await notificationService.send({
      recipientId: testUser._id.toString(),
      type: "karma_awarded",
      title: "Civic Karma Awarded",
      message: "+50 Karma points for civic verification",
      actionUrl: "/rewards",
    });
    await notificationService.send({
      recipientId: testUser._id.toString(),
      type: "complaint_resolved",
      title: "Issue Resolved",
      message: "Streetlight restored by electrical squad",
      actionUrl: "/track",
    });

    const markAllRes = await axios.patch(`${baseUrl}/api/notifications/read-all`, {}, authHeaders);
    assert.strictEqual(markAllRes.status, 200);
    assert.strictEqual(markAllRes.data.success, true);

    const countAfter = await Notification.countDocuments({ recipient: testUser._id, isRead: false });
    assert.strictEqual(countAfter, 0);
    console.log("  ✅ Mark all read successfully set all notifications to isRead: true");

    // ─── Test 5: FCM Token Registration & Removal ──────────────────────────────
    console.log("\n▶ [Test 5] Testing POST & DELETE /api/notifications/fcm-token...");
    const fcmTokenVal = "sample_fcm_registration_token_123456";
    const postFcmRes = await axios.post(`${baseUrl}/api/notifications/fcm-token`, { token: fcmTokenVal }, authHeaders);
    assert.strictEqual(postFcmRes.status, 200);

    const userWithFcm = await User.findById(testUser._id);
    assert.strictEqual(userWithFcm.fcmToken, fcmTokenVal);
    console.log("  ✅ FCM token saved to user record");

    const deleteFcmRes = await axios.delete(`${baseUrl}/api/notifications/fcm-token`, authHeaders);
    assert.strictEqual(deleteFcmRes.status, 200);

    const userWithoutFcm = await User.findById(testUser._id);
    assert.strictEqual(userWithoutFcm.fcmToken, null);
    console.log("  ✅ FCM token removed on logout");

    // ─── Test 6: Real-Time WebSocket Notification Delivery ─────────────────────
    console.log("\n▶ [Test 6] Testing Real-Time WebSocket Notification Delivery...");
    const clientSocket = ClientIO(baseUrl, {
      auth: { token: userToken },
      transports: ["websocket"],
      reconnection: false,
    });

    const receivedEvent = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("WebSocket notification event timed out after 5000ms")), 5000);

      clientSocket.on("connect", () => {
        console.log(`  🔌 Client socket connected with id: ${clientSocket.id}`);
        // Trigger live notification
        setTimeout(() => {
          notifyUser(testUser._id.toString(), {
            title: "Live Waterlogging Alert",
            message: "Hindmata water pumping station active. Avoid low-lying subways.",
            actionUrl: "/map",
            type: "general",
          });
        }, 300);
      });

      clientSocket.on("notification", (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });

    assert(receivedEvent, "Client must receive notification payload");
    assert.strictEqual(receivedEvent.title, "Live Waterlogging Alert");
    console.log(`  ✅ Real-time WebSocket event received by client: "${receivedEvent.title}"`);

    clientSocket.disconnect();

    console.log("\n================================================================================");
    console.log("🎉 ALL NOTIFICATION SYSTEM & WEBSOCKET TESTS PASSED PERFECTLY!");
    console.log("================================================================================\n");

  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

testNotificationSystem().catch((err) => {
  console.error("❌ Notification Test Failed:", err);
  process.exit(1);
});
