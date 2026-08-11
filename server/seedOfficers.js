require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Ward = require("./models/Ward");
const Department = require("./models/Department");
const Officer = require("./models/Officer");
const User = require("./models/User");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smart-civic";

const seedOfficers = async () => {
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
        name: "Officer Ramesh (PWD, H-West)",
        email: "ramesh.pwd.hwest@smartcity.gov.in",
        department: pwdDept._id,
        wardId: hWestWard._id,
        wardName: hWestWard.name,
        employeeId: "EMP-PWD-001"
      },
      {
        name: "Officer Suresh (SWM, H-West)",
        email: "suresh.swm.hwest@smartcity.gov.in",
        department: swmDept._id,
        wardId: hWestWard._id,
        wardName: hWestWard.name,
        employeeId: "EMP-SWM-001"
      },
      {
        name: "Officer Geeta (PWD, Ward A)",
        email: "geeta.pwd.warda@smartcity.gov.in",
        department: pwdDept._id,
        wardId: aWard._id,
        wardName: aWard.name,
        employeeId: "EMP-PWD-002"
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
          role: "officer",
          phoneNumber: "98765432" + Math.floor(10 + Math.random() * 90),
          isEmailVerified: true
        });
      }

      // Create officer profile
      let officer = await Officer.findOne({ employeeId: profile.employeeId });
      if (!officer) {
        await Officer.create({
          user: user._id,
          department: profile.department,
          wardId: profile.wardId,
          wardName: profile.wardName,
          employeeId: profile.employeeId,
          designation: "Ward Supervisor",
          isAvailable: true,
          activeComplaintsCount: 0
        });
        createdCount++;
      }
    }

    console.log(`Successfully seeded ${createdCount} demo officers.`);
    mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error("Error seeding officers:", error);
    process.exit(1);
  }
};

seedOfficers();
