/**
 * test_rbac_matrix.js
 * End-to-End Automated RBAC (Role-Based Access Control) & Authentication Verification Suite
 * Tests all 4 system roles: citizen, worker, officer, admin
 */

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");
const app = require("../index");

// Configure Axios client to not throw on 4xx/5xx responses
const testClient = axios.create({
  validateStatus: () => true,
});

async function runRbacSuite() {
  console.log("\n================================================================================");
  console.log("🛡️  Smart Civic AI — Automated RBAC Security & Access Control Test Suite");
  console.log("================================================================================");

  // 1. Connect MongoDB
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing from environment variables.");
    process.exit(1);
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected for RBAC Verification.");
  }

  // 2. Start an ephemeral HTTP test server
  const testServer = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const port = testServer.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🔌 Ephemeral Test Server running on ${baseUrl}`);

  const testResults = [];

  const rolesToTest = [
    { role: "citizen", email: "test.citizen.rbac@mumbai.gov.in", name: "Citizen Test User" },
    { role: "worker",  email: "test.worker.rbac@mumbai.gov.in",  name: "Field Worker Test User" },
    { role: "officer", email: "test.officer.rbac@mumbai.gov.in", name: "Municipal Officer Test User" },
    { role: "admin",   email: "test.admin.rbac@mumbai.gov.in",   name: "Admin Commissioner Test User" },
  ];

  const tokens = {};
  const userRecords = {};

  console.log("\n--- Phase 1: Provisioning Test Role Accounts & Validating JWT Tokens ---");

  for (const r of rolesToTest) {
    let user = await User.findOne({ email: r.email });
    if (!user) {
      user = new User({
        name: r.name,
        email: r.email,
        password: "Password123!",
        role: r.role,
        isEmailVerified: true,
        isActive: true,
        ward: "Ward H-West",
      });
      await user.save();
      console.log(`  ➕ Provisioned test user for role [${r.role}]: ${r.email}`);
    } else {
      user.role = r.role;
      user.isEmailVerified = true;
      user.isActive = true;
      await user.save();
      console.log(`  ✓ Found existing test user for role [${r.role}]: ${r.email}`);
    }

    userRecords[r.role] = user;
    const token = user.generateToken();
    tokens[r.role] = token;

    // Verify JWT payload structure
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenValid = decoded && decoded.role === r.role && String(decoded.id) === String(user._id);

    testResults.push({
      category: "JWT Issuance",
      role: r.role,
      action: `Generate signed JWT for role [${r.role}]`,
      expected: `Payload role === '${r.role}'`,
      actual: `Decoded role === '${decoded?.role}'`,
      passed: tokenValid,
    });
  }

  console.log("\n--- Phase 2: Testing Unauthenticated (Zero-Trust) Access ---");

  // Test 1: Unauthenticated request to protected route
  const resNoToken = await testClient.get(`${baseUrl}/api/auth/me`);
  testResults.push({
    category: "Zero Trust",
    role: "Unauthenticated",
    action: "GET /api/auth/me without token",
    expected: "401 Unauthorized",
    actual: `${resNoToken.status} ${resNoToken.data?.message || ""}`,
    passed: resNoToken.status === 401,
  });

  const resInvalidToken = await testClient.get(`${baseUrl}/api/complaints`, {
    headers: { Authorization: "Bearer invalid_tampered_token_xyz" },
  });
  testResults.push({
    category: "Zero Trust",
    role: "Invalid Token",
    action: "GET /api/complaints with tampered token",
    expected: "401 Unauthorized",
    actual: `${resInvalidToken.status} ${resInvalidToken.data?.message || ""}`,
    passed: resInvalidToken.status === 401,
  });

  console.log("\n--- Phase 3: Testing Citizen Access Permissions & Restrictions ---");
  const citizenHeaders = { Authorization: `Bearer ${tokens.citizen}` };

  // Citizen: Create Complaint (Authorized)
  const resCitizenCreate = await testClient.post(
    `${baseUrl}/api/complaints`,
    {
      title: "Pothole on Linking Road near Bandra Station",
      description: "Severe crater causing traffic delay and safety hazard for two-wheelers.",
      category: "roads_and_infrastructure",
      locationAddress: "Linking Road, Bandra West, Mumbai, Maharashtra 400050",
      latitude: 19.0607,
      longitude: 72.8362,
    },
    { headers: citizenHeaders }
  );
  testResults.push({
    category: "Citizen Permissions",
    role: "citizen",
    action: "POST /api/complaints (Create Grievance)",
    expected: "201 Created / 200 OK",
    actual: `${resCitizenCreate.status}`,
    passed: resCitizenCreate.status === 201 || resCitizenCreate.status === 200,
  });

  // Citizen: Access own complaints (Authorized)
  const resCitizenGet = await testClient.get(`${baseUrl}/api/complaints`, { headers: citizenHeaders });
  testResults.push({
    category: "Citizen Permissions",
    role: "citizen",
    action: "GET /api/complaints (Own Grievances)",
    expected: "200 OK",
    actual: `${resCitizenGet.status}`,
    passed: resCitizenGet.status === 200,
  });

  // Citizen: Assign Worker (Restricted -> 403)
  const resCitizenAssign = await testClient.put(
    `${baseUrl}/api/complaints/67bf58720000000000000000/assign-worker`,
    { workerId: "67bf58720000000000000001" },
    { headers: citizenHeaders }
  );
  testResults.push({
    category: "Citizen Restrictions",
    role: "citizen",
    action: "PUT /api/complaints/:id/assign-worker",
    expected: "403 Forbidden",
    actual: `${resCitizenAssign.status} (${resCitizenAssign.data?.message})`,
    passed: resCitizenAssign.status === 403,
  });

  // Citizen: Access Admin Dead Letter Queue (Restricted -> 403)
  const resCitizenDlq = await testClient.get(`${baseUrl}/api/admin/queues/failed`, { headers: citizenHeaders });
  testResults.push({
    category: "Citizen Restrictions",
    role: "citizen",
    action: "GET /api/admin/queues/failed (Admin DLQ)",
    expected: "403 Forbidden",
    actual: `${resCitizenDlq.status}`,
    passed: resCitizenDlq.status === 403,
  });

  // Citizen: Access Officer Management (Restricted -> 403)
  const resCitizenOfficer = await testClient.get(`${baseUrl}/api/officers`, { headers: citizenHeaders });
  testResults.push({
    category: "Citizen Restrictions",
    role: "citizen",
    action: "GET /api/officers (Officer Provisioning)",
    expected: "403 Forbidden",
    actual: `${resCitizenOfficer.status}`,
    passed: resCitizenOfficer.status === 403,
  });

  // Citizen: Access Admin Users Management (Restricted -> 403)
  const resCitizenUsers = await testClient.get(`${baseUrl}/api/auth/users`, { headers: citizenHeaders });
  testResults.push({
    category: "Citizen Restrictions",
    role: "citizen",
    action: "GET /api/auth/users (User Directory)",
    expected: "403 Forbidden",
    actual: `${resCitizenUsers.status}`,
    passed: resCitizenUsers.status === 403,
  });

  console.log("\n--- Phase 4: Testing Field Worker Access Permissions & Restrictions ---");
  const workerHeaders = { Authorization: `Bearer ${tokens.worker}` };

  // Worker: View Assigned Worker Tasks (Authorized)
  const resWorkerTasks = await testClient.get(`${baseUrl}/api/complaints/worker-tasks`, { headers: workerHeaders });
  testResults.push({
    category: "Worker Permissions",
    role: "worker",
    action: "GET /api/complaints/worker-tasks",
    expected: "200 OK",
    actual: `${resWorkerTasks.status}`,
    passed: resWorkerTasks.status === 200,
  });

  // Worker: Create complaint bypass (Restricted -> 403)
  const resWorkerCreate = await testClient.post(
    `${baseUrl}/api/complaints`,
    {
      title: "Unauthorized Worker Ticket Creation Attempt",
      description: "Field workers are restricted from direct self-reporting grievance bypass.",
      category: "other",
      locationAddress: "Mumbai Ward H-West",
    },
    { headers: workerHeaders }
  );
  testResults.push({
    category: "Worker Restrictions",
    role: "worker",
    action: "POST /api/complaints (Create Grievance Bypass)",
    expected: "403 Forbidden",
    actual: `${resWorkerCreate.status}`,
    passed: resWorkerCreate.status === 403,
  });

  // Worker: Access Admin Performance Scorecard (Restricted -> 403)
  const resWorkerAdminPerf = await testClient.get(`${baseUrl}/api/admin/ward-performance`, { headers: workerHeaders });
  testResults.push({
    category: "Worker Restrictions",
    role: "worker",
    action: "GET /api/admin/ward-performance",
    expected: "403 Forbidden",
    actual: `${resWorkerAdminPerf.status}`,
    passed: resWorkerAdminPerf.status === 403,
  });

  // Worker: Access Admin DLQ (Restricted -> 403)
  const resWorkerDlq = await testClient.get(`${baseUrl}/api/admin/queues/failed`, { headers: workerHeaders });
  testResults.push({
    category: "Worker Restrictions",
    role: "worker",
    action: "GET /api/admin/queues/failed",
    expected: "403 Forbidden",
    actual: `${resWorkerDlq.status}`,
    passed: resWorkerDlq.status === 403,
  });

  // Worker: Access Admin Users Directory (Restricted -> 403)
  const resWorkerUsers = await testClient.get(`${baseUrl}/api/auth/users`, { headers: workerHeaders });
  testResults.push({
    category: "Worker Restrictions",
    role: "worker",
    action: "GET /api/auth/users (User Directory)",
    expected: "403 Forbidden",
    actual: `${resWorkerUsers.status}`,
    passed: resWorkerUsers.status === 403,
  });

  console.log("\n--- Phase 5: Testing Municipal Officer Access Permissions & Restrictions ---");
  const officerHeaders = { Authorization: `Bearer ${tokens.officer}` };

  // Officer: View Complaint Stats (Authorized)
  const resOfficerStats = await testClient.get(`${baseUrl}/api/complaints/stats`, { headers: officerHeaders });
  testResults.push({
    category: "Officer Permissions",
    role: "officer",
    action: "GET /api/complaints/stats (Ward Analytics)",
    expected: "200 OK",
    actual: `${resOfficerStats.status}`,
    passed: resOfficerStats.status === 200,
  });

  // Officer: View Ward Performance Scorecard (Authorized)
  const resOfficerPerf = await testClient.get(`${baseUrl}/api/admin/ward-performance`, { headers: officerHeaders });
  testResults.push({
    category: "Officer Permissions",
    role: "officer",
    action: "GET /api/admin/ward-performance (Scorecard)",
    expected: "200 OK",
    actual: `${resOfficerPerf.status}`,
    passed: resOfficerPerf.status === 200,
  });

  // Officer: View Contractors List (Authorized)
  const resOfficerContractors = await testClient.get(`${baseUrl}/api/admin/contractors`, { headers: officerHeaders });
  testResults.push({
    category: "Officer Permissions",
    role: "officer",
    action: "GET /api/admin/contractors",
    expected: "200 OK",
    actual: `${resOfficerContractors.status}`,
    passed: resOfficerContractors.status === 200,
  });

  // Officer: Department Reassignment Override (Admin Only -> 403)
  const resOfficerReassignDept = await testClient.patch(
    `${baseUrl}/api/admin/complaints/67bf58720000000000000000/department`,
    { departmentId: "67bf58720000000000000002" },
    { headers: officerHeaders }
  );
  testResults.push({
    category: "Officer Restrictions",
    role: "officer",
    action: "PATCH /api/admin/complaints/:id/department",
    expected: "403 Forbidden",
    actual: `${resOfficerReassignDept.status}`,
    passed: resOfficerReassignDept.status === 403,
  });

  // Officer: Access Dead Letter Queue (Admin Only -> 403)
  const resOfficerDlq = await testClient.get(`${baseUrl}/api/admin/queues/failed`, { headers: officerHeaders });
  testResults.push({
    category: "Officer Restrictions",
    role: "officer",
    action: "GET /api/admin/queues/failed",
    expected: "403 Forbidden",
    actual: `${resOfficerDlq.status}`,
    passed: resOfficerDlq.status === 403,
  });

  // Officer: Officer Management Endpoint (Admin Only -> 403)
  const resOfficerManage = await testClient.get(`${baseUrl}/api/officers`, { headers: officerHeaders });
  testResults.push({
    category: "Officer Restrictions",
    role: "officer",
    action: "GET /api/officers (Officer Provisioning)",
    expected: "403 Forbidden",
    actual: `${resOfficerManage.status}`,
    passed: resOfficerManage.status === 403,
  });

  console.log("\n--- Phase 6: Testing Admin Root Permissions ---");
  const adminHeaders = { Authorization: `Bearer ${tokens.admin}` };

  // Admin: View All Complaints (Authorized)
  const resAdminAllComplaints = await testClient.get(`${baseUrl}/api/complaints/all`, { headers: adminHeaders });
  testResults.push({
    category: "Admin Permissions",
    role: "admin",
    action: "GET /api/complaints/all",
    expected: "200 OK",
    actual: `${resAdminAllComplaints.status}`,
    passed: resAdminAllComplaints.status === 200,
  });

  // Admin: View Ward Performance (Authorized)
  const resAdminPerf = await testClient.get(`${baseUrl}/api/admin/ward-performance`, { headers: adminHeaders });
  testResults.push({
    category: "Admin Permissions",
    role: "admin",
    action: "GET /api/admin/ward-performance",
    expected: "200 OK",
    actual: `${resAdminPerf.status}`,
    passed: resAdminPerf.status === 200,
  });

  // Admin: View Failed Queue Jobs (Authorized)
  const resAdminDlq = await testClient.get(`${baseUrl}/api/admin/queues/failed`, { headers: adminHeaders });
  testResults.push({
    category: "Admin Permissions",
    role: "admin",
    action: "GET /api/admin/queues/failed",
    expected: "200 OK",
    actual: `${resAdminDlq.status}`,
    passed: resAdminDlq.status === 200,
  });

  // Admin: View Officer Management (Authorized)
  const resAdminOfficers = await testClient.get(`${baseUrl}/api/officers`, { headers: adminHeaders });
  testResults.push({
    category: "Admin Permissions",
    role: "admin",
    action: "GET /api/officers (Officer Provisioning)",
    expected: "200 OK",
    actual: `${resAdminOfficers.status}`,
    passed: resAdminOfficers.status === 200,
  });

  // Admin: View User Management (Authorized)
  const resAdminUsers = await testClient.get(`${baseUrl}/api/auth/users`, { headers: adminHeaders });
  testResults.push({
    category: "Admin Permissions",
    role: "admin",
    action: "GET /api/auth/users (User Directory)",
    expected: "200 OK",
    actual: `${resAdminUsers.status}`,
    passed: resAdminUsers.status === 200,
  });

  // Cleanup test server
  await new Promise((resolve) => testServer.close(resolve));

  // Print Formatted Report Table
  console.log("\n================================================================================");
  console.log("📊  RBAC VERIFICATION & SECURITY AUDIT SUMMARY TABLE");
  console.log("================================================================================");
  console.log(
    "| " +
      "ROLE".padEnd(10) +
      " | " +
      "CATEGORY".padEnd(22) +
      " | " +
      "ACTION / ROUTE TESTED".padEnd(42) +
      " | " +
      "RESULT".padEnd(8) +
      " |"
  );
  console.log("|" + "-".repeat(12) + "|" + "-".repeat(24) + "|" + "-".repeat(44) + "|" + "-".repeat(10) + "|");

  let totalPassed = 0;
  for (const r of testResults) {
    const statusBadge = r.passed ? "✅ PASS" : "❌ FAIL";
    if (r.passed) totalPassed++;
    console.log(
      `| ${r.role.padEnd(10)} | ${r.category.padEnd(22)} | ${r.action.slice(0, 42).padEnd(42)} | ${statusBadge.padEnd(8)} |`
    );
  }

  const scorePct = Math.round((totalPassed / testResults.length) * 100);
  console.log("================================================================================");
  console.log(`Total Tests Run: ${testResults.length} | Passed: ${totalPassed} | Failed: ${testResults.length - totalPassed}`);
  console.log(`🛡️  Overall RBAC Security Health Score: ${scorePct}% (${scorePct === 100 ? "100% SECURE & HARDENED" : "REGRESSION DETECTED"})`);
  console.log("================================================================================\n");

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  if (scorePct !== 100) {
    process.exit(1);
  }
}

runRbacSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test Suite Runtime Error:", err);
    process.exit(1);
  });
