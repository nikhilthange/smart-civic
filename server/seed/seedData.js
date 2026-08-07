const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Complaint = require("../models/Complaint");
const Department = require("../models/Department");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart-civic";

const seedDatabase = async () => {
  try {
    console.log("🌱 Connecting to MongoDB for seeding...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected.");

    // ─── 1. Upsert Default Department ─────────────────────────────────────────
    let dept = await Department.findOne({ code: "PWD" });
    if (!dept) {
      dept = await Department.create({
        name: "Public Works Department",
        code: "PWD",
        contactEmail: "pwd.bmc@smartcity.gov.in",
        contactPhone: "+912224930000",
      });
      console.log("🏢 Created default PWD Department.");
    }

    // ─── 2. Upsert Demo Accounts across 4 Roles ────────────────────────────────
    const defaultPassword = "password123";

    // Citizen Account
    let citizen = await User.findOne({ email: "citizen@bmc.gov.in" });
    if (!citizen) {
      citizen = await User.create({
        name: "Rahul Verma (Citizen)",
        email: "citizen@bmc.gov.in",
        password: defaultPassword,
        role: "citizen",
        karmaPoints: 40,
        ward: "Ward H-West",
        zone: "Zone 3",
        phoneNumber: "+919876543210",
        address: "Hill Road, Bandra West, Mumbai",
      });
      console.log("👤 Created Citizen account: citizen@bmc.gov.in");
    }

    // Officer Account
    let officer = await User.findOne({ email: "officer@bmc.gov.in" });
    if (!officer) {
      officer = await User.create({
        name: "Rajesh Kumar (Officer)",
        email: "officer@bmc.gov.in",
        password: defaultPassword,
        role: "officer",
        ward: "Ward H-West",
        zone: "Zone 3",
        department: dept._id,
        phoneNumber: "+919876543211",
      });
      console.log("👮 Created Officer account: officer@bmc.gov.in");
    }

    // Worker Account
    let worker = await User.findOne({ email: "worker@bmc.gov.in" });
    if (!worker) {
      worker = await User.create({
        name: "Suresh Shinde (Field Worker)",
        email: "worker@bmc.gov.in",
        password: defaultPassword,
        role: "worker",
        ward: "Ward H-West",
        zone: "Zone 3",
        department: dept._id,
        phoneNumber: "+919876543212",
      });
      console.log("👷 Created Worker account: worker@bmc.gov.in");
    }

    // Admin Account
    let admin = await User.findOne({ email: "admin@bmc.gov.in" });
    if (!admin) {
      admin = await User.create({
        name: "BMC Admin Commissioner",
        email: "admin@bmc.gov.in",
        password: defaultPassword,
        role: "admin",
        corporationId: "BMC",
        ward: "Ward A",
        zone: "Zone 1",
        phoneNumber: "+919876543213",
      });
      console.log("👑 Created Admin account: admin@bmc.gov.in");
    }

    // ─── 3. Seed Realistic Sample BMC Complaints ──────────────────────────────
    const existingComplaintsCount = await Complaint.countDocuments();
    if (existingComplaintsCount === 0) {
      const now = new Date();

      const sampleComplaints = [
        {
          title: "Dangerous Deep Pothole on Hill Road",
          description: "Severe pothole near Bandra station causing traffic hazard and vehicle damage during monsoons.",
          category: "roads_and_infrastructure",
          priority: "critical",
          status: "pending",
          ward: "Ward H-West",
          zone: "Zone 3",
          corporationId: "BMC",
          jurisdictionType: "municipal",
          citizen: citizen._id,
          department: dept._id,
          slaDeadline: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12h SLA
          slaStatus: "on_time",
          location: {
            address: "Hill Road, Bandra West, Mumbai 400050",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400050",
            coordinates: { type: "Point", coordinates: [72.8347, 19.0596] },
          },
          statusHistory: [{ status: "pending", changedBy: citizen._id, note: "Reported by citizen." }],
        },
        {
          title: "Overflowing Garbage Dump near Churchgate Station",
          description: "Solid waste accumulating near station exit, creating unhygienic conditions for commuters.",
          category: "garbage_collection",
          priority: "high",
          status: "assigned",
          ward: "Ward A",
          zone: "Zone 1",
          corporationId: "BMC",
          jurisdictionType: "municipal",
          citizen: citizen._id,
          assignedWorker: worker._id,
          department: dept._id,
          slaDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24h SLA
          slaStatus: "on_time",
          location: {
            address: "Maharshi Karve Road, Colaba, Mumbai 400020",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400020",
            coordinates: { type: "Point", coordinates: [72.8277, 18.9322] },
          },
          statusHistory: [{ status: "assigned", changedBy: officer._id, note: "Assigned to field team." }],
        },
        {
          title: "Main Pipeline Water Leakage in Andheri East",
          description: "Clean water gushing onto Andheri Kurla Road from damaged municipal pipeline.",
          category: "water_and_sanitation",
          priority: "medium",
          status: "in_progress",
          ward: "Ward K-East",
          zone: "Zone 4",
          corporationId: "BMC",
          jurisdictionType: "municipal",
          citizen: citizen._id,
          assignedWorker: worker._id,
          department: dept._id,
          slaDeadline: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48h SLA
          slaStatus: "on_time",
          location: {
            address: "Andheri-Kurla Road, Andheri East, Mumbai 400069",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400069",
            coordinates: { type: "Point", coordinates: [72.8697, 19.1136] },
          },
          statusHistory: [{ status: "in_progress", changedBy: worker._id, note: "Worker on site fixing valve." }],
        },
        {
          title: "Non-Functional Streetlight near Dadar TT Circle",
          description: "Streetlights dark for past 3 days causing safety concerns at night.",
          category: "street_lighting",
          priority: "low",
          status: "resolved",
          ward: "Ward G-North",
          zone: "Zone 2",
          corporationId: "BMC",
          jurisdictionType: "municipal",
          citizen: citizen._id,
          assignedWorker: worker._id,
          department: dept._id,
          slaDeadline: new Date(now.getTime() + 72 * 60 * 60 * 1000),
          slaStatus: "on_time",
          resolvedAt: now,
          resolutionNotes: "Replaced blown bulb and repaired wiring fixture.",
          resolutionImage: {
            url: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=600",
            filename: "proof_streetlight.jpg",
          },
          location: {
            address: "Dadar TT Circle, Dadar, Mumbai 400014",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400014",
            coordinates: { type: "Point", coordinates: [72.8427, 19.0178] },
          },
          statusHistory: [{ status: "resolved", changedBy: worker._id, note: "Repair completed with proof image." }],
        },
      ];

      await Complaint.create(sampleComplaints);
      console.log(`📋 Seeded ${sampleComplaints.length} sample BMC Ward complaints.`);
    } else {
      console.log(`📋 Database already contains ${existingComplaintsCount} complaints. Skipping complaint creation.`);
    }

    console.log("\n🎉 Database Seeding Complete!");
    console.log("==========================================");
    console.log("Demo Credentials (Password: password123):");
    console.log("  - Citizen: citizen@bmc.gov.in");
    console.log("  - Officer: officer@bmc.gov.in");
    console.log("  - Worker:  worker@bmc.gov.in");
    console.log("  - Admin:   admin@bmc.gov.in");
    console.log("==========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedDatabase();
