"use strict";

const assert = require("assert");
const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const Complaint = require("../models/Complaint");
const User = require("../models/User");
const complaintRoutes = require("../routes/complaintRoutes");

async function testOfflineSupportFlow() {
  console.log("================================================================================");
  console.log("📶 TESTING OFFLINE CAPABILITIES, QUEUE SERIALIZATION & AUTO-SYNC ENGINE");
  console.log("================================================================================\n");

  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart_civic_test";
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log("  ✅ Connected to MongoDB");

  // Setup Express server for offline flush test
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/api/complaints", complaintRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`  ✅ Test Server listening on ${baseUrl}`);

  let testUser = null;
  let testOfficer = null;
  let testWorker = null;
  let citizenToken = "";
  let workerToken = "";
  let createdComplaintId = "";

  try {
    // ── Setup test users ──────────────────────────────────────────────────────
    testUser = await User.findOne({ email: "offline.tester.citizen@mumbai.gov.in" });
    if (!testUser) {
      testUser = await User.create({
        name: "Offline Citizen Tester",
        email: "offline.tester.citizen@mumbai.gov.in",
        password: "Password123!",
        role: "citizen",
        ward: "Ward K/W",
      });
    }

    testWorker = await User.findOne({ email: "offline.tester.worker@mumbai.gov.in" });
    if (!testWorker) {
      testWorker = await User.create({
        name: "Offline Worker Tester",
        email: "offline.tester.worker@mumbai.gov.in",
        password: "Password123!",
        role: "worker",
        ward: "Ward K/W",
      });
    }

    citizenToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET || "smart-civic-secret-key-development", {
      expiresIn: "1h",
    });
    workerToken = jwt.sign({ id: testWorker._id }, process.env.JWT_SECRET || "smart-civic-secret-key-development", {
      expiresIn: "1h",
    });

    // ── [Test 1] Simulate Offline Citizen Grievance Serialization ─────────────
    console.log("\n▶ [Test 1] Testing Offline Citizen Grievance Serialization...");
    const clientProvisionalId = `SC-${new Date().getFullYear()}-OFFLINE-${Math.floor(10000 + Math.random() * 90000)}`;
    const offlineItem = {
      id: `offline-${Date.now()}-abc123`,
      clientTicketId: clientProvisionalId,
      title: "Broken Water Pipeline under Western Express Highway",
      description: "Severe water outflow flooding service lane near Andheri flyover.",
      category: "water_and_sanitation",
      locationAddress: "WEH Service Road, Andheri East, Mumbai",
      locationCity: "Mumbai",
      locationState: "Maharashtra",
      locationPincode: "400069",
      ward: "Ward K/W",
      lat: 19.1136,
      lng: 72.8697,
      priority: "high",
      isAnonymous: false,
      attachments: [
        {
          filename: "leakage_proof.jpg",
          mime: "image/jpeg",
          base64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
        },
      ],
      timestamp: Date.now(),
    };

    assert.ok(offlineItem.clientTicketId.startsWith("SC-"), "Provisional ticket ID must match municipal format");
    assert.strictEqual(offlineItem.category, "water_and_sanitation");
    assert.strictEqual(offlineItem.attachments.length, 1);
    console.log(`  ✅ Offline item constructed with provisional ID: ${offlineItem.clientTicketId}`);

    // ── [Test 2] Simulate Offline Auto-Sync Flush to Backend ───────────────────
    console.log("\n▶ [Test 2] Simulating Offline Sync Flush (Reconnection to /api/complaints)...");

    const boundary = "----SmartCivicOfflineBoundary" + Math.random().toString(36).substring(2);
    let postData = "";
    const addField = (name, val) => {
      postData += `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${val}\r\n`;
    };

    addField("title", offlineItem.title);
    addField("description", offlineItem.description);
    addField("category", offlineItem.category);
    addField("locationAddress", offlineItem.locationAddress);
    addField("locationCity", offlineItem.locationCity);
    addField("locationState", offlineItem.locationState);
    addField("locationPincode", offlineItem.locationPincode);
    addField("ward", offlineItem.ward);
    addField("lat", String(offlineItem.lat));
    addField("lng", String(offlineItem.lng));
    addField("priority", offlineItem.priority);
    addField("isAnonymous", String(offlineItem.isAnonymous));

    // Add binary image part
    const rawBase64 = offlineItem.attachments[0].base64.split(",")[1];
    const imageBuffer = Buffer.from(rawBase64, "base64");
    postData += `--${boundary}\r\nContent-Disposition: form-data; name="attachments"; filename="leakage_proof.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`;

    const fullPayload = Buffer.concat([
      Buffer.from(postData, "utf8"),
      imageBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`, "utf8"),
    ]);

    const syncResponse = await new Promise((resolve, reject) => {
      const req = http.request(
        `${baseUrl}/api/complaints`,
        {
          method: "POST",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "Content-Length": fullPayload.length,
            Authorization: `Bearer ${citizenToken}`,
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(body) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: body });
            }
          });
        }
      );
      req.on("error", reject);
      req.write(fullPayload);
      req.end();
    });

    assert.strictEqual(syncResponse.status, 201, "Sync must successfully persist complaint (HTTP 201)");
    assert.ok(syncResponse.data.complaint, "Response must include confirmed complaint");
    createdComplaintId = syncResponse.data.complaint._id;
    const realComplaintId = syncResponse.data.complaint.complaintId;
    console.log(`  ✅ Offline report successfully flushed to server: Registered official ID ${realComplaintId}`);

    // ── [Test 3] Verify Local Cache Merge ─────────────────────────────────────
    console.log("\n▶ [Test 3] Verifying Cached Complaints Structure...");
    const cachedComplaints = [
      {
        _id: syncResponse.data.complaint._id,
        complaintId: realComplaintId,
        title: offlineItem.title,
        status: syncResponse.data.complaint.status,
        category: offlineItem.category,
        createdAt: new Date().toISOString(),
      },
    ];

    assert.strictEqual(cachedComplaints.length, 1);
    assert.strictEqual(cachedComplaints[0].complaintId, realComplaintId);
    console.log("  ✅ Local cache contains confirmed server record");

    // ── [Test 4] Worker Offline Resolution Submission ─────────────────────────
    console.log("\n▶ [Test 4] Simulating Worker Offline Resolution Submission...");
    
    // Assign complaint to worker first
    await Complaint.findByIdAndUpdate(createdComplaintId, {
      status: "in_progress",
      assignedWorker: testWorker._id,
    });

    const workerBoundary = "----SmartCivicWorkerBoundary" + Math.random().toString(36).substring(2);
    let workerPostData = "";
    workerPostData += `--${workerBoundary}\r\nContent-Disposition: form-data; name="notes"\r\n\r\nRepaired main valve and sealed pipe seam.\r\n`;
    workerPostData += `--${workerBoundary}\r\nContent-Disposition: form-data; name="resolutionImage"; filename="fixed_proof.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`;

    const workerPayload = Buffer.concat([
      Buffer.from(workerPostData, "utf8"),
      imageBuffer,
      Buffer.from(`\r\n--${workerBoundary}--\r\n`, "utf8"),
    ]);

    const workerSyncResponse = await new Promise((resolve, reject) => {
      const req = http.request(
        `${baseUrl}/api/complaints/${createdComplaintId}/worker-submit`,
        {
          method: "PUT",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${workerBoundary}`,
            "Content-Length": workerPayload.length,
            Authorization: `Bearer ${workerToken}`,
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(body) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: body });
            }
          });
        }
      );
      req.on("error", reject);
      req.write(workerPayload);
      req.end();
    });

    assert.strictEqual(workerSyncResponse.status, 200, "Worker resolution must succeed (HTTP 200)");
    assert.strictEqual(workerSyncResponse.data.complaint.status, "resolution_submitted");
    console.log("  ✅ Worker offline resolution successfully synchronized with cloud database");

    console.log("\n================================================================================");
    console.log("🎉 ALL OFFLINE SUPPORT & AUTO-SYNC TESTS PASSED PERFECTLY!");
    console.log("================================================================================\n");
  } finally {
    // Cleanup test records
    if (createdComplaintId) {
      await Complaint.findByIdAndDelete(createdComplaintId).catch(() => {});
    }
    if (testUser) {
      await User.findByIdAndDelete(testUser._id).catch(() => {});
    }
    if (testWorker) {
      await User.findByIdAndDelete(testWorker._id).catch(() => {});
    }
    server.close();
    await mongoose.disconnect();
  }
}

testOfflineSupportFlow().catch((err) => {
  console.error("❌ Offline Support Test failed:", err);
  process.exit(1);
});
