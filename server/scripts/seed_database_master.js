/**
 * ─── Master Database Seeder: 24 Mumbai Wards & Enterprise Subsystems ──────────
 * Seeds MongoDB with realistic municipal baseline data across all models.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Department = require("../models/Department");
const Complaint = require("../models/Complaint");
const SubwayStatus = require("../models/SubwayStatus");
const ContractorScorecard = require("../models/ContractorScorecard");
const HousingSociety = require("../models/HousingSociety");
const EmergencyBroadcast = require("../models/EmergencyBroadcast");
const SocialCivicPost = require("../models/SocialCivicPost");
const GreenBond = require("../models/GreenBond");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart-civic";

async function seedMasterDatabase() {
  console.log("================================================================================");
  console.log("🌱 INITIATING MASTER DATABASE SEEDER (24 WARDS & ENTERPRISE PERSISTENCE)");
  console.log("================================================================================\n");

  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB:", MONGO_URI);

  // 1. Seed Departments
  console.log("\n[1/9] Seeding Municipal Departments...");
  const dept = await Department.findOneAndUpdate(
    { code: "ROADS" },
    {
      $set: {
        name: "Roads & Traffic Department",
        code: "ROADS",
        description: "Asphalt, concrete roads, potholes, trenching reinstatement",
        categories: ["roads_and_infrastructure", "potholes", "street_lighting"],
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  // 2. Seed Core Users
  console.log("[2/9] Seeding Core Users (Citizen, Officer, Field Worker, Admin, Bot)...");
  const users = [
    {
      name: "Nikhil Kadam (Citizen)",
      email: "citizen@bmc.gov.in",
      phone: "919820011111",
      role: "citizen",
      password: "Password123!",
      isVerified: true,
      karmaPoints: 450,
      rewardTier: "GOLD_SENTINEL",
    },
    {
      name: "Sunil Godse (Ward Officer)",
      email: "officer@bmc.gov.in",
      phone: "919820022222",
      role: "officer",
      ward: "Ward H-West",
      department: dept._id,
      password: "Password123!",
      isVerified: true,
    },
    {
      name: "Suresh Gaikwad (Field Crew Lead)",
      email: "worker@bmc.gov.in",
      phone: "919820033333",
      role: "worker",
      ward: "Ward H-West",
      department: dept._id,
      password: "Password123!",
      isVerified: true,
    },
    {
      name: "Municipal Commissioner Admin",
      email: "admin@bmc.gov.in",
      phone: "919820044444",
      role: "admin",
      password: "Password123!",
      isVerified: true,
    },
    {
      name: "BMC Social Radar AI",
      email: "social_bot@bmc.gov.in",
      phone: "919999900000",
      role: "citizen",
      password: "Password123!",
      isVerified: true,
    },
  ];

  for (const u of users) {
    await User.findOneAndUpdate({ email: u.email }, { $set: u }, { upsert: true, returnDocument: "after" });
  }
  const citizenUser = await User.findOne({ email: "citizen@bmc.gov.in" });
  const workerUser = await User.findOne({ email: "worker@bmc.gov.in" });

  // 3. Seed Subways
  console.log("[3/9] Seeding Critical Mumbai Underpasses & Flood Gauges...");
  const subways = [
    {
      subwayId: "SUBWAY-MUM-01",
      subwayName: "Andheri Subway (SV Road Underpass)",
      ward: "Ward K-West",
      waterDepthCm: 14,
      criticalThresholdCm: 30,
      trafficStatus: "OPEN",
      safeDetourCorridor: "Gokhale Bridge / Captain Gore Flyover",
      alternateFlyoverName: "Gokhale Bridge",
      activePumpsCount: 4,
      location: {
        type: "Point",
        coordinates: [72.8467, 19.1197],
      },
    },
    {
      subwayId: "SUBWAY-MUM-02",
      subwayName: "Milan Subway (Santacruz West)",
      ward: "Ward H-West",
      waterDepthCm: 8,
      criticalThresholdCm: 30,
      trafficStatus: "OPEN",
      safeDetourCorridor: "Milan Flyover (SV Road to WEH)",
      alternateFlyoverName: "Milan Flyover",
      activePumpsCount: 3,
      location: {
        type: "Point",
        coordinates: [72.8431, 19.0833],
      },
    },
    {
      subwayId: "SUBWAY-MUM-03",
      subwayName: "Khar Subway (Khar West)",
      ward: "Ward H-West",
      waterDepthCm: 11,
      criticalThresholdCm: 30,
      trafficStatus: "OPEN",
      safeDetourCorridor: "Bandra ROB / Khar Danda Link",
      alternateFlyoverName: "Bandra ROB",
      activePumpsCount: 3,
      location: {
        type: "Point",
        coordinates: [72.8392, 19.0712],
      },
    },
  ];

  for (const s of subways) {
    await SubwayStatus.findOneAndUpdate({ subwayId: s.subwayId }, { $set: s }, { upsert: true });
  }

  // 4. Seed Contractor Scorecards
  console.log("[4/9] Seeding Contractor 3-Strike Scorecards & Escrow Ledgers...");
  const contractors = [
    {
      contractorId: "CON-MUM-RD-01",
      companyName: "Reliable Infrastructure & Asphalts Ltd",
      panGstNumber: "27AABCR8819Q1ZT",
      assignedWards: ["Ward H-West", "Ward K-West"],
      activeProjectsCount: 8,
      completedProjectsCount: 142,
      reliabilityScore: 94,
      strikesCount: 0,
      escrowBalanceInr: 5000000,
      frozenEscrowInr: 0,
      status: "ACTIVE_GOOD_STANDING",
    },
    {
      contractorId: "CON-MUM-SW-02",
      companyName: "Apex Civil & Drainage Works LLP",
      panGstNumber: "27AAZPA4410K1ZX",
      assignedWards: ["Ward G-North", "Ward F-South"],
      activeProjectsCount: 4,
      completedProjectsCount: 88,
      reliabilityScore: 78,
      strikesCount: 1,
      escrowBalanceInr: 3200000,
      frozenEscrowInr: 0,
      status: "UNDER_PROBATION",
      strikeLogs: [
        {
          strikeNumber: 1,
          complaintId: "SC-2026-0412",
          reason: "Delayed pothole cold-mix repair beyond 24h SLA",
          upheldBy: "Ward AMC (F-South)",
          issuedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ],
    },
    {
      contractorId: "CON-MUM-FL-03",
      companyName: "Defective Roads & Infra Corp",
      panGstNumber: "27AABCD9901M1ZQ",
      assignedWards: ["Ward L (Kurla)"],
      activeProjectsCount: 1,
      completedProjectsCount: 45,
      reliabilityScore: 32,
      strikesCount: 3,
      escrowBalanceInr: 0,
      frozenEscrowInr: 2500000,
      status: "BLACKLISTED_FROZEN",
      statutoryDebarmentOrder: {
        orderNumber: "BMC/DEBAR/2026/084",
        issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        legalSection: "MMC Act Section 354 Debarment",
      },
    },
  ];

  for (const c of contractors) {
    await ContractorScorecard.findOneAndUpdate({ contractorId: c.contractorId }, { $set: c }, { upsert: true });
  }

  // 5. Seed Housing Societies
  console.log("[5/9] Seeding ALM Cooperative Housing Societies (CHS)...");
  const societies = [
    {
      societyId: "CHS-MUM-HW-01",
      societyName: "Pali Hill Residents ALM Cooperative Society",
      ward: "Ward H-West",
      registrationNumber: "BOM/W-H/HSG/TC/10492",
      flatCount: 180,
      residentCount: 650,
      segregationScorePct: 92,
      dailyWetWasteKg: 210,
      dailyDryWasteKg: 130,
      hasCompostPit: true,
      hasRainwaterHarvesting: true,
      taxRebateEligible: true,
      taxRebatePct: 5,
      annualTaxSavingsInr: 340000,
      compactorVisitSchedule: {
        dayOfWeek: "DAILY",
        timeSlot: "07:00 AM - 08:30 AM",
      },
    },
    {
      societyId: "CHS-MUM-GN-02",
      societyName: "Shivaji Park Citizens ALM Association",
      ward: "Ward G-North",
      registrationNumber: "BOM/W-G/HSG/TC/8821",
      flatCount: 120,
      residentCount: 420,
      segregationScorePct: 86,
      dailyWetWasteKg: 160,
      dailyDryWasteKg: 95,
      hasCompostPit: true,
      hasRainwaterHarvesting: false,
      taxRebateEligible: true,
      taxRebatePct: 5,
      annualTaxSavingsInr: 210000,
      compactorVisitSchedule: {
        dayOfWeek: "MON_WED_FRI",
        timeSlot: "08:00 AM - 09:30 AM",
      },
    },
    {
      societyId: "CHS-MUM-KW-03",
      societyName: "Lokhandwala Complex Green CHS Ltd",
      ward: "Ward K-West",
      registrationNumber: "BOM/W-K/HSG/TC/14022",
      flatCount: 320,
      residentCount: 1100,
      segregationScorePct: 74,
      dailyWetWasteKg: 380,
      dailyDryWasteKg: 240,
      hasCompostPit: false,
      hasRainwaterHarvesting: true,
      taxRebateEligible: false,
      taxRebatePct: 0,
      annualTaxSavingsInr: 0,
      compactorVisitSchedule: {
        dayOfWeek: "TUE_THU_SAT",
        timeSlot: "09:00 AM - 10:30 AM",
      },
    },
  ];

  for (const s of societies) {
    await HousingSociety.findOneAndUpdate({ societyId: s.societyId }, { $set: s }, { upsert: true });
  }

  // 6. Seed Emergency Broadcasts
  console.log("[6/9] Seeding Geo-Fenced Disaster Broadcasts...");
  const broadcasts = [
    {
      broadcastId: "ALERT-2026-0801",
      title: "Andheri Subway Inundation & Traffic Detour Alert",
      message: "Andheri Subway water height has exceeded 0.45m due to high tide + cloudburst. Divert to Gokhale Bridge / Captain Gore Flyover.",
      severity: "SUBWAY_INUNDATION",
      targetWard: "Ward K-West & K-East",
      bufferRadiusKm: 2.0,
      channels: ["WEB_PUSH", "WHATSAPP", "SMS_CELL_BROADCAST", "MCS_VARIABLE_MESSAGE_SIGNS"],
      estimatedCitizenReachCount: 142000,
      dispatchedBy: "Disaster Management Cell (BMC HQ)",
      dispatchedAt: new Date(Date.now() - 45 * 60 * 1000),
    },
    {
      broadcastId: "ALERT-2026-0802",
      title: "Arabian Sea High Tide Warning (4.62m at 14:42 IST)",
      message: "IMD High Tide Alert. Citizens and fishermen advised to avoid Marine Drive promenade, Bandra Bandstand, and Juhu Beach.",
      severity: "HIGH_TIDE_WARNING",
      targetWard: "ALL_COASTAL_WARDS",
      bufferRadiusKm: 1.5,
      channels: ["WEB_PUSH", "WHATSAPP"],
      estimatedCitizenReachCount: 380000,
      dispatchedBy: "SWD Disaster Monitoring Desk",
      dispatchedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  ];

  for (const b of broadcasts) {
    await EmergencyBroadcast.findOneAndUpdate({ broadcastId: b.broadcastId }, { $set: b }, { upsert: true });
  }

  // 7. Seed Social Civic Posts
  console.log("[7/9] Seeding Social Civic Radar Posts...");
  const socialPosts = [
    {
      postId: "tw-182939101",
      platform: "X_TWITTER",
      authorHandle: "@mumbaicommute",
      authorName: "Rohan Varma",
      content: "Massive crater on Linking Road near KFC Bandra West! 3 scooters had near misses in 10 mins. @mybmc please fix urgently! #MumbaiRains",
      extractedCategory: "roads_and_infrastructure",
      extractedWard: "Ward H-West",
      extractedLandmark: "Linking Road near KFC, Bandra West",
      sentiment: "URGENT",
      likesCount: 142,
      retweetsCount: 38,
      status: "CONVERTED_TO_TICKET",
      convertedComplaintId: "SC-2026-0842",
    },
    {
      postId: "tw-182939102",
      platform: "X_TWITTER",
      authorHandle: "@juhu_citizens",
      authorName: "Juhu Residents Forum",
      content: "Storm water drain completely clogged with plastic near Juhu Beach entrance. Water starting to back up on Juhu Tara Road.",
      extractedCategory: "storm_water_drains",
      extractedWard: "Ward K-West",
      extractedLandmark: "Juhu Beach North Entry, Juhu Tara Road",
      sentiment: "FRUSTRATED",
      likesCount: 89,
      retweetsCount: 19,
      status: "PENDING_TRIAGE",
    },
  ];

  for (const sp of socialPosts) {
    await SocialCivicPost.findOneAndUpdate({ postId: sp.postId }, { $set: sp }, { upsert: true });
  }

  // 8. Seed Green Bonds
  console.log("[8/9] Seeding Municipal Green Bond Portfolios & CapEx...");
  const greenBonds = [
    {
      bondId: "BMC-GB-2026-SR1",
      seriesName: "BMC Mumbai Climate Resilient Green Bond 2026 (Series I)",
      totalIssueSizeCr: 500,
      couponRatePct: 7.25,
      tenureYears: 10,
      creditRating: "CRISIL AA+ (SO) / CARE AA+",
      allocatedCapExCr: 385,
      unallocatedBalanceCr: 115,
      carbonOffsetAnnualTons: 24500,
      targetWardAllocations: [
        { ward: "Ward H-West", projectCategory: "Mithi River Eco-Restoration & Bio-Retention", allocatedAmountCr: 120 },
        { ward: "Ward F-South", projectCategory: "Underground Flood Holding Tanks (Hindmata)", allocatedAmountCr: 145 },
        { ward: "Ward A", projectCategory: "Solar Rooftop on Municipal Schools", allocatedAmountCr: 120 },
      ],
      status: "ACTIVE_SUBSCRIBED",
    },
  ];

  for (const gb of greenBonds) {
    await GreenBond.findOneAndUpdate({ bondId: gb.bondId }, { $set: gb }, { upsert: true });
  }

  // 9. Seed Realistic Complaints
  console.log("[9/9] Seeding 24-Ward Municipal Complaints...");
  const complaints = [
    {
      complaintId: "SC-2026-0842",
      title: "Severe Road Crater & Edge Deterioration on Linking Road",
      description: "Severe pothole measuring 2.4m x 1.1m across northbound lane. Poses immediate vehicular hazard.",
      category: "roads_and_infrastructure",
      ward: "Ward H-West",
      citizen: citizenUser._id,
      priority: "high",
      status: "assigned",
      assignedWorker: workerUser._id,
      location: {
        type: "Point",
        coordinates: [72.8347, 19.0596],
        address: "Linking Road, Bandra West, Mumbai 400050",
      },
    },
    {
      complaintId: "SC-2026-0843",
      title: "Garbage Overflow at Dadar Flower Market Collection Point",
      description: "Organic waste and floral debris accumulating over 1.5 tons blocking pedestrian walkway.",
      category: "garbage_collection",
      ward: "Ward G-North",
      citizen: citizenUser._id,
      priority: "high",
      status: "in_progress",
      location: {
        type: "Point",
        coordinates: [72.8437, 19.0178],
        address: "Dadar TT Circle / Flower Market, Mumbai 400014",
      },
    },
    {
      complaintId: "SC-2026-0844",
      title: "SWD Drain Grid Choked with Debris near Hindmata",
      description: "Major roadside storm water drainage inlet blocked by construction silt, causing slow runoff.",
      category: "storm_water_drains",
      ward: "Ward F-South",
      citizen: citizenUser._id,
      priority: "critical",
      status: "resolved",
      location: {
        type: "Point",
        coordinates: [72.8398, 19.0068],
        address: "Dr. Ambedkar Road, Hindmata Flyover, Parel",
      },
    },
  ];

  for (const c of complaints) {
    await Complaint.findOneAndUpdate({ complaintId: c.complaintId }, { $set: c }, { upsert: true });
  }

  console.log("\n================================================================================");
  console.log("🎉 MASTER DATABASE SEEDING COMPLETE! (All collections 100% persistent in MongoDB)");
  console.log("================================================================================\n");

  await mongoose.disconnect();
}

if (require.main === module) {
  seedMasterDatabase().catch((err) => {
    console.error("❌ Master Seeder Error:", err);
    process.exit(1);
  });
}

module.exports = seedMasterDatabase;
