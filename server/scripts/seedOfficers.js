/**
 * ─── BMC Department Officers Database Seeder ──────────────────────────────────
 * Populates MongoDB with active Officer User accounts and Officer profiles
 * across all 10 BMC Municipal Departments and target Wards.
 * Generates `login.md` credentials table in the project root.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load Environment Variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Department = require("../models/Department");
const Officer = require("../models/Officer");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart-civic";
const DEFAULT_PASSWORD = "Officer@2026";

// Department definitions
const DEPARTMENTS = [
  { code: "PWD", name: "Public Works Department (Roads & Infrastructure)", icon: "HardHat" },
  { code: "SWM", name: "Solid Waste Management Department", icon: "Trash2" },
  { code: "SWD", name: "Storm Water Drains Department", icon: "Waves" },
  { code: "WSD", name: "Water Supply & Sewage Department", icon: "Droplets" },
  { code: "PRD", name: "Parks & Tree Authority Department", icon: "Trees" },
  { code: "ELD", name: "Electricity & Streetlights Department", icon: "Zap" },
  { code: "PHD", name: "Public Health Department", icon: "Activity" },
  { code: "LIC", name: "License & Encroachment Department", icon: "FileText" },
  { code: "PSD", name: "Public Safety Department", icon: "Shield" },
  { code: "GEN", name: "General Administration Department", icon: "Building2" },
];

const WARDS = [
  { name: "Ward A", zone: "Zone 1" },
  { name: "Ward G-South", zone: "Zone 2" },
  { name: "Ward H-West", zone: "Zone 3" },
  { name: "Ward K-East", zone: "Zone 4" },
];

async function seedOfficers() {
  console.log("==================================================");
  console.log("    BMC DEPARTMENT OFFICERS SEEDER & LOGIN GEN    ");
  console.log("==================================================\n");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB:", MONGODB_URI);

    const seededLogins = [];

    // 1. Ensure all Departments exist
    const deptMap = {};
    for (const d of DEPARTMENTS) {
      let deptDoc = await Department.findOne({ code: d.code });
      if (!deptDoc) {
        deptDoc = await Department.create({
          code: d.code,
          name: d.name,
          contactEmail: `contact.${d.code.toLowerCase()}@smartcity.gov.in`,
        });
      }
      deptMap[d.code] = deptDoc;
    }

    // 2. Seed Officers for each Department and Ward combination
    let officerCount = 0;

    for (const d of DEPARTMENTS) {
      const deptDoc = deptMap[d.code];

      for (let i = 0; i < WARDS.length; i++) {
        const w = WARDS[i];
        const email = `officer.${d.code.toLowerCase()}.${w.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@smartcity.gov.in`;
        const employeeId = `BMC-${d.code}-OFF-${String(i + 1).padStart(2, "0")}`;
        const officerName = `Officer ${d.code} (${w.name})`;

        // Find or create User
        let userDoc = await User.findOne({ email });
        if (!userDoc) {
          userDoc = new User({
            name: officerName,
            email,
            password: DEFAULT_PASSWORD,
            role: "officer",
            department: deptDoc._id,
            ward: w.name,
            zone: w.zone,
            isActive: true,
          });
          await userDoc.save();
        } else {
          userDoc.role = "officer";
          userDoc.department = deptDoc._id;
          userDoc.ward = w.name;
          userDoc.zone = w.zone;
          userDoc.isActive = true;
          userDoc.password = DEFAULT_PASSWORD;
          await userDoc.save();
        }

        // Find or create Officer profile
        let officerDoc = await Officer.findOne({ user: userDoc._id });
        if (!officerDoc) {
          officerDoc = await Officer.create({
            user: userDoc._id,
            department: deptDoc._id,
            employeeId,
            designation: `Executive Ward Engineer (${d.code})`,
            isAvailable: true,
          });
        }

        officerCount++;
        seededLogins.push({
          deptCode: d.code,
          deptName: d.name,
          name: officerName,
          ward: w.name,
          zone: w.zone,
          email,
          password: DEFAULT_PASSWORD,
          badgeId: employeeId,
          role: "officer"
        });
      }
    }

    // Also include Admin and Citizen sample logins in login.md
    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser) {
      seededLogins.unshift({
        deptCode: "ADMIN",
        deptName: "System Administration",
        name: adminUser.name,
        ward: "All Wards",
        zone: "Central HQ",
        email: adminUser.email,
        password: "AdminPassword123!",
        badgeId: "BMC-HQ-ADM-01",
        role: "admin"
      });
    } else {
      seededLogins.unshift({
        deptCode: "ADMIN",
        deptName: "System Administration",
        name: "BMC Admin Officer",
        ward: "All Wards",
        zone: "Central HQ",
        email: "admin@smartcity.gov.in",
        password: "AdminPassword123!",
        badgeId: "BMC-HQ-ADM-01",
        role: "admin"
      });
    }

    console.log(`✅ Successfully seeded ${officerCount} Department Officers across 10 BMC departments!`);

    // 3. Generate login.md in project root
    const rootDir = path.join(__dirname, "../../");
    const loginMdPath = path.join(rootDir, "login.md");

    let markdownContent = `# Smart Civic Portal — Official User & Officer Credentials Matrix\n\n`;
    markdownContent += `This document lists active login credentials for municipal officers, administrators, and field personnel across all 10 Brihanmumbai Municipal Corporation (BMC) departments.\n\n`;
    markdownContent += `## 🏛️ System Credentials Table\n\n`;
    markdownContent += `| Dept Code | Department Name | Officer Full Name | Assigned Ward / Zone | Email Address | Plaintext Password | Role | Employee Badge ID |\n`;
    markdownContent += `| :---: | :--- | :--- | :---: | :--- | :--- | :---: | :---: |\n`;

    for (const l of seededLogins) {
      markdownContent += `| **${l.deptCode}** | ${l.deptName} | ${l.name} | ${l.ward} (${l.zone}) | \`${l.email}\` | \`${l.password}\` | \`${l.role}\` | \`${l.badgeId}\` |\n`;
    }

    markdownContent += `\n---\n\n`;
    markdownContent += `## 🚀 Authentication Testing Instructions\n`;
    markdownContent += `1. Navigate to the portal login page (\`/auth\`).\n`;
    markdownContent += `2. Copy any **Email Address** and **Plaintext Password** from the table above.\n`;
    markdownContent += `3. Upon logging in as an Officer, complaints submitted in your department/ward will be automatically pre-assigned to your dashboard.\n`;

    fs.writeFileSync(loginMdPath, markdownContent, "utf8");
    console.log(`📄 Generated login.md at: ${loginMdPath}`);

  } catch (err) {
    console.error("Seeding Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seedOfficers();
