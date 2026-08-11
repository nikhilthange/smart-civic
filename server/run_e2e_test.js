require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Models
const User = require("./models/User");
const Worker = require("./models/Worker");
const Officer = require("./models/Officer");
const Complaint = require("./models/Complaint");
const Department = require("./models/Department");

// Controllers
const complaintController = require("./controllers/complaintController");

// Mocking Request/Response
const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

async function runE2E() {
  console.log("Connecting to Database...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to Database.\n");

  try {
    console.log("--- 1. Setup Data ---");
    // Find or create citizen, officer, and worker
    let citizen = await User.findOne({ role: "citizen" });
    if (!citizen) {
      citizen = await User.create({ name: "Test Citizen", email: "citizen@test.com", password: "password123", role: "citizen" });
    }

    let dept = await Department.findOne();
    if (!dept) {
      dept = await Department.create({ code: "PWD", name: "Public Works", contactEmail: "pwd@test.com" });
    }

    let officerUser = await User.findOne({ role: "officer" });
    if (!officerUser) {
      officerUser = await User.create({ name: "Test Officer", email: "officer@test.com", password: "password123", role: "officer" });
    }
    let officer = await Officer.findOne({ user: officerUser._id }).populate("user");
    if (!officer) {
      officer = await Officer.create({ 
        user: officerUser._id, 
        department: dept._id, 
        wardName: "Test Ward",
        wardId: new mongoose.Types.ObjectId(),
        designation: "Ward Officer",
        employeeId: "EMP-OFF-001"
      });
      officer.user = officerUser;
    }

    let workerUser = await User.findOne({ role: "worker" });
    if (!workerUser) {
      workerUser = await User.create({ name: "Test Worker", email: "worker@test.com", password: "password123", role: "worker" });
    }
    let worker = await Worker.findOne({ user: workerUser._id }).populate("user");
    if (!worker) {
      worker = await Worker.create({ 
        user: workerUser._id, 
        department: dept._id, 
        wardName: "Test Ward",
        wardId: new mongoose.Types.ObjectId(),
        employeeId: "EMP-WRK-001",
        skills: ["road repair"]
      });
      worker.user = workerUser;
    }

    console.log(`Citizen: ${citizen.name} | Officer: ${officer.user.name} | Worker: ${worker.user.name}\n`);

    console.log("--- 2. Create Complaint ---");
    const createReq = {
      user: { id: citizen._id },
      body: {
        title: "E2E Test Complaint - Huge Pothole",
        description: "There is a massive pothole in front of my house causing a lot of issues.",
        category: "roads_and_infrastructure",
        locationAddress: "123 Main St, Mumbai",
        latitude: 19.0760,
        longitude: 72.8777,
      },
      files: [] // No files for simplicity
    };
    const createRes = mockRes();
    await complaintController.createComplaint(createReq, createRes);
    if (createRes.statusCode !== 200 && createRes.statusCode !== 201) {
      throw new Error("Failed to create complaint: " + JSON.stringify(createRes.data));
    }
    const complaintId = createRes.data.complaint._id;
    console.log("Complaint Created! ID:", complaintId, "Status:", createRes.data.complaint.status);

    console.log("\n--- 3. Assign Officer ---");
    const assignOfficerReq = {
      user: { id: officer.user._id },
      params: { id: complaintId },
      body: { officerId: officer._id }
    };
    const assignOfficerRes = mockRes();
    await complaintController.assignOfficer(assignOfficerReq, assignOfficerRes);
    console.log("Officer Assigned! Status:", assignOfficerRes.data.complaint.status);

    console.log("\n--- 4. Assign Worker ---");
    const assignWorkerReq = {
      user: { id: officer.user._id },
      params: { id: complaintId },
      body: { workerId: worker._id }
    };
    const assignWorkerRes = mockRes();
    await complaintController.assignWorker(assignWorkerReq, assignWorkerRes);
    console.log("Worker Assigned! Status:", assignWorkerRes.data.complaint.status);

    console.log("\n--- 5. Start Work ---");
    const startWorkReq = {
      user: { id: worker.user._id },
      params: { id: complaintId },
      body: {}
    };
    const startWorkRes = mockRes();
    await complaintController.workerStartWork(startWorkReq, startWorkRes);
    console.log("Work Started! Status:", startWorkRes.data.complaint.status);

    console.log("\n--- 6. Worker Submit Proof ---");
    const submitProofReq = {
      user: { id: worker.user._id },
      params: { id: complaintId },
      body: { resolutionNotes: "Pothole filled successfully." },
      file: { filename: "test_proof.jpg", path: "/uploads/test_proof.jpg" }
    };
    const submitProofRes = mockRes();
    await complaintController.workerSubmitProof(submitProofReq, submitProofRes);
    console.log("Proof Submitted! Status:", submitProofRes.data.complaint.status);

    console.log("\n--- 7. Officer Approve Resolution ---");
    const resolveReq = {
      user: { id: officer.user._id },
      params: { id: complaintId },
      body: { resolutionNotes: "Approved the work." }
    };
    const resolveRes = mockRes();
    await complaintController.resolveComplaint(resolveReq, resolveRes);
    console.log("Complaint Resolved! Status:", resolveRes.data.complaint.status);

    console.log("\n--- E2E Test Completed Successfully ---");
    
  } catch (error) {
    console.error("E2E Test Failed:", error);
  } finally {
    mongoose.disconnect();
  }
}

runE2E();
