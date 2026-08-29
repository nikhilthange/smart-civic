/**
 * test_production_integration.js
 * End-to-End Live Integration and Smoke Test Suite
 * Targets:
 *   Frontend: https://smart-civic-pi.vercel.app
 *   Backend: https://smart-civic-a1rz.onrender.com
 */

const axios = require("axios");

const PROD_BACKEND = "https://smart-civic-a1rz.onrender.com";
const PROD_FRONTEND_ORIGIN = "https://smart-civic-pi.vercel.app";

const client = axios.create({
  baseURL: PROD_BACKEND,
  timeout: 45000,
  validateStatus: () => true,
  headers: {
    "Origin": PROD_FRONTEND_ORIGIN,
  },
});

async function runLiveSmokeTest() {
  console.log("\n================================================================================");
  console.log("🌐  Smart Civic AI — Production E2E Smoke & Integration Verification");
  console.log("================================================================================");
  console.log(`📡 Backend Target:  ${PROD_BACKEND}`);
  console.log(`💻 Frontend Origin: ${PROD_FRONTEND_ORIGIN}\n`);

  const results = [];

  // --- Step 1: Health & Uptime Check ---
  console.log("--- Step 1: Probing Production Backend Health & Telemetry ---");
  const healthRes = await client.get("/health");
  results.push({
    test: "Production Health Check (/health)",
    expected: "200 OK & Database Connected",
    actual: `${healthRes.status} (DB: ${healthRes.data?.database?.status || "N/A"})`,
    passed: healthRes.status === 200 && healthRes.data?.database?.status === "CONNECTED",
  });

  const apiLiveRes = await client.get("/api/live");
  results.push({
    test: "API Gateway Telemetry (/api/live)",
    expected: "200 OK (status: ok)",
    actual: `${apiLiveRes.status} (${apiLiveRes.data?.status || "N/A"})`,
    passed: apiLiveRes.status === 200 && apiLiveRes.data?.status === "ok",
  });

  // --- Step 2: CORS Preflight & Security Headers Check ---
  console.log("\n--- Step 2: CORS Preflight & Security Header Handshake ---");
  const corsRes = await client.options("/api/complaints", {
    headers: {
      "Origin": PROD_FRONTEND_ORIGIN,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "Authorization,Content-Type",
    },
  });
  const allowOrigin = corsRes.headers["access-control-allow-origin"];
  results.push({
    test: "CORS Preflight Handshake (OPTIONS /api/complaints)",
    expected: "200/204 with Access-Control-Allow-Origin",
    actual: `${corsRes.status} (Allow-Origin: ${allowOrigin || "None"})`,
    passed: (corsRes.status === 200 || corsRes.status === 204) && (allowOrigin === "*" || allowOrigin === PROD_FRONTEND_ORIGIN),
  });

  // --- Step 3: Role Authentication & JWT Token Issuance on Production ---
  console.log("\n--- Step 3: Role Authentication & Token Verification ---");
  const roles = [
    { role: "citizen", email: "test.citizen.rbac@mumbai.gov.in" },
    { role: "worker",  email: "test.worker.rbac@mumbai.gov.in" },
    { role: "officer", email: "test.officer.rbac@mumbai.gov.in" },
    { role: "admin",   email: "test.admin.rbac@mumbai.gov.in" },
  ];

  const tokens = {};

  for (const r of roles) {
    const loginRes = await client.post("/api/auth/login", {
      email: r.email,
      password: "Password123!",
    });

    const hasToken = Boolean(loginRes.data?.token);
    const returnedRole = loginRes.data?.user?.role;
    if (hasToken) tokens[r.role] = loginRes.data.token;

    results.push({
      test: `Live Authentication for [${r.role}]`,
      expected: `200 OK with token & role: '${r.role}'`,
      actual: `${loginRes.status} (Role: '${returnedRole}')`,
      passed: loginRes.status === 200 && hasToken && returnedRole === r.role,
    });
  }

  // --- Step 4: Citizen Core Workflow ---
  console.log("\n--- Step 4: Citizen Grievance Lifecycle ---");
  const citizenHeaders = { Authorization: `Bearer ${tokens.citizen}` };
  
  // Submit Complaint
  const createRes = await client.post(
    "/api/complaints",
    {
      title: "Live E2E Smoke Test Grievance - Pothole on Hill Road",
      description: "Automated smoke test validating production API integration, AI triage, and database persistence.",
      category: "roads_and_infrastructure",
      locationAddress: "Hill Road, Bandra West, Mumbai, Maharashtra 400050",
      latitude: 19.0558,
      longitude: 72.8295,
    },
    { headers: citizenHeaders }
  );
  results.push({
    test: "Citizen: POST /api/complaints (Submit Grievance)",
    expected: "200/201 Success",
    actual: `${createRes.status} (Ticket: ${createRes.data?.ticketId || createRes.data?.complaint?.complaintId || "Created"})`,
    passed: createRes.status === 200 || createRes.status === 201,
  });

  // Query Citizen Complaints
  const listRes = await client.get("/api/complaints", { headers: citizenHeaders });
  results.push({
    test: "Citizen: GET /api/complaints (Fetch History)",
    expected: "200 OK",
    actual: `${listRes.status} (Total: ${listRes.data?.complaints?.length ?? listRes.data?.count ?? "OK"})`,
    passed: listRes.status === 200,
  });

  // --- Step 5: Worker Core Workflow ---
  console.log("\n--- Step 5: Worker Task Queue Access ---");
  const workerHeaders = { Authorization: `Bearer ${tokens.worker}` };
  const workerTasksRes = await client.get("/api/complaints/worker-tasks", { headers: workerHeaders });
  results.push({
    test: "Worker: GET /api/complaints/worker-tasks",
    expected: "200 OK",
    actual: `${workerTasksRes.status}`,
    passed: workerTasksRes.status === 200,
  });

  // --- Step 6: Officer Core Workflow ---
  console.log("\n--- Step 6: Municipal Officer Analytics & Ward Management ---");
  const officerHeaders = { Authorization: `Bearer ${tokens.officer}` };
  
  const statsRes = await client.get("/api/complaints/stats", { headers: officerHeaders });
  results.push({
    test: "Officer: GET /api/complaints/stats (Ward SLA Stats)",
    expected: "200 OK",
    actual: `${statsRes.status}`,
    passed: statsRes.status === 200,
  });

  const wardPerfRes = await client.get("/api/admin/ward-performance", { headers: officerHeaders });
  results.push({
    test: "Officer: GET /api/admin/ward-performance (Scorecard)",
    expected: "200 OK",
    actual: `${wardPerfRes.status}`,
    passed: wardPerfRes.status === 200,
  });

  // --- Step 7: Admin Core Workflow ---
  console.log("\n--- Step 7: Administrative Oversight & Governance ---");
  const adminHeaders = { Authorization: `Bearer ${tokens.admin}` };

  const adminComplaintsRes = await client.get("/api/complaints/all", { headers: adminHeaders });
  results.push({
    test: "Admin: GET /api/complaints/all",
    expected: "200 OK",
    actual: `${adminComplaintsRes.status}`,
    passed: adminComplaintsRes.status === 200,
  });

  const adminUsersRes = await client.get("/api/auth/users", { headers: adminHeaders });
  results.push({
    test: "Admin: GET /api/auth/users (User Directory)",
    expected: "200 OK",
    actual: `${adminUsersRes.status}`,
    passed: adminUsersRes.status === 200,
  });

  const adminOfficersRes = await client.get("/api/officers", { headers: adminHeaders });
  results.push({
    test: "Admin: GET /api/officers (Officer Provisioning)",
    expected: "200 OK",
    actual: `${adminOfficersRes.status}`,
    passed: adminOfficersRes.status === 200,
  });

  const adminDlqRes = await client.get("/api/admin/queues/failed", { headers: adminHeaders });
  results.push({
    test: "Admin: GET /api/admin/queues/failed (DLQ)",
    expected: "200 OK",
    actual: `${adminDlqRes.status}`,
    passed: adminDlqRes.status === 200,
  });

  // --- Summary Table ---
  console.log("\n================================================================================");
  console.log("📊  PRODUCTION INTEGRATION & SMOKE TEST SUMMARY TABLE");
  console.log("================================================================================");
  console.log(
    "| " +
      "TEST SCENARIO".padEnd(52) +
      " | " +
      "ACTUAL RESPONSE".padEnd(20) +
      " | " +
      "RESULT".padEnd(8) +
      " |"
  );
  console.log("|" + "-".repeat(54) + "|" + "-".repeat(22) + "|" + "-".repeat(10) + "|");

  let passedCount = 0;
  for (const r of results) {
    const badge = r.passed ? "✅ PASS" : "❌ FAIL";
    if (r.passed) passedCount++;
    console.log(
      `| ${r.test.padEnd(52)} | ${r.actual.slice(0, 20).padEnd(20)} | ${badge.padEnd(8)} |`
    );
  }

  const score = Math.round((passedCount / results.length) * 100);
  console.log("================================================================================");
  console.log(`Total Scenarios: ${results.length} | Passed: ${passedCount} | Failed: ${results.length - passedCount}`);
  console.log(`🚀 Production Integration Readiness: ${score}% (${score === 100 ? "FULLY OPERATIONAL" : "ACTION REQUIRED"})`);
  console.log("================================================================================\n");

  if (score !== 100) {
    process.exit(1);
  }
}

runLiveSmokeTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Live Smoke Test Execution Error:", err);
    process.exit(1);
  });
