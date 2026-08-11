require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Ward = require("./models/Ward");
const Department = require("./models/Department");
const Worker = require("./models/Worker");
const User = require("./models/User");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smart-civic";

const seedWorkers = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Fetch dependencies
    const wards = await Ward.find();
    if (wards.length === 0) {
      console.log("No wards found. Please run seedWards.js first.");
      process.exit(1);
    }
    
    let pwdDept = await Department.findOne({ code: "PWD" });
    if (!pwdDept) {
      pwdDept = await Department.create({ code: "PWD", name: "PWD / Roads", contactEmail: "contact.pwd@smartcity.gov.in" });
    }

    let swmDept = await Department.findOne({ code: "SWM" });
    if (!swmDept) {
      swmDept = await Department.create({ code: "SWM", name: "Solid Waste Management", contactEmail: "contact.swm@smartcity.gov.in" });
    }

    const hWestWard = wards.find(w => w.code === "WHW");
    const aWard = wards.find(w => w.code === "WA");

    if (!hWestWard || !aWard) {
      console.log("Required demo wards not found.");
      process.exit(1);
    }

    const demoProfiles = [
      {
        name: "Field Worker Ashok (PWD, H-West)",
        email: "ashok.pwd.hwest@smartcity.gov.in",
        department: pwdDept._id,
        wardId: hWestWard._id,
        wardName: hWestWard.name,
        employeeId: "FW-PWD-001"
      },
      {
        name: "Field Worker Mukesh (PWD, H-West)",
        email: "mukesh.pwd.hwest@smartcity.gov.in",
        department: pwdDept._id,
        wardId: hWestWard._id,
        wardName: hWestWard.name,
        employeeId: "FW-PWD-002"
      },
      {
        name: "Field Worker Sanjay (SWM, H-West)",
        email: "sanjay.swm.hwest@smartcity.gov.in",
        department: swmDept._id,
        wardId: hWestWard._id,
        wardName: hWestWard.name,
        employeeId: "FW-SWM-001"
      },
      {
        name: "Field Worker Amit (PWD, Ward A)",
        email: "amit.pwd.warda@smartcity.gov.in",
        department: pwdDept._id,
        wardId: aWard._id,
        wardName: aWard.name,
        employeeId: "FW-PWD-003"
      }
    ];

    let createdCount = 0;

    for (const profile of demoProfiles) {
      // Create user account
      let user = await User.findOne({ email: profile.email });
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);
        user = await User.create({
          name: profile.name,
          email: profile.email,
          password: hashedPassword,
          role: "worker",
          phoneNumber: "98765431" + Math.floor(10 + Math.random() * 90),
          isEmailVerified: true
        });
      }

      // Create worker profile
      let worker = await Worker.findOne({ employeeId: profile.employeeId });
      if (!worker) {
        await Worker.create({
          user: user._id,
          department: profile.department,
          wardId: profile.wardId,
          wardName: profile.wardName,
          employeeId: profile.employeeId,
          isAvailable: true,
          activeComplaintsCount: 0
        });
        createdCount++;
      }
    }

    console.log(`Successfully seeded ${createdCount} demo workers.`);
    mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error("Error seeding workers:", error);
    process.exit(1);
  }
};

seedWorkers();
