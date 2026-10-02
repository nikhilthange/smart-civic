"use strict";

const RtsStatutoryPenalty = require("../models/RtsStatutoryPenalty");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Officer = require("../models/Officer");
const crypto = require("crypto");

class RtsEnforcementService {
  constructor() {
    this.auditOpenComplaintsForRts = this.auditOpenComplaintsForRts.bind(this);
    this.issueStatutoryNotice = this.issueStatutoryNotice.bind(this);
    this.adjudicatePenalty = this.adjudicatePenalty.bind(this);
    this.compensateAggrievedCitizen = this.compensateAggrievedCitizen.bind(this);
    this.getRtsSummary = this.getRtsSummary.bind(this);
    this.getAllPenalties = this.getAllPenalties.bind(this);
    this.ensureSeedData = this.ensureSeedData.bind(this);
  }

  /**
   * Issues a formal statutory show-cause notice under Section 10 of Maharashtra RTS Act 2015
   */
  async issueStatutoryNotice({
    complaintId,
    complaintTitle,
    ward = "Ward G-North",
    category = "roads_and_infrastructure",
    officerEmployeeId = "BMC-EE-8812",
    officerName = "Shri. Rajesh Patil",
    officerDesignation = "Executive Engineer (EE)",
    officerDepartment = "PWD",
    complainantCitizenId = "usr_citizen_demo_99",
    complainantName = "Adv. Ramesh Varma",
    complainantEmail = "citizen@mumbai.gov.in",
    statutoryTimeLimitHours = 24,
    elapsedHours = 72,
  }) {
    const existing = await RtsStatutoryPenalty.findOne({ complaintId });
    if (existing) return existing;

    const delayHours = Math.max(0, elapsedHours - statutoryTimeLimitHours);
    const delayDays = Math.max(1, Math.ceil(delayHours / 24));
    const dailyRate = 250; // Section 10: ₹250 per day
    const penaltyCap = 5000; // Section 10: ₹5,000 statutory cap
    const totalPenalty = Math.min(penaltyCap, delayDays * dailyRate);

    const wardCode = (ward.split(" ")[1] || "BMC").replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const noticeNumber = `RTS-2026-${wardCode}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const penalty = await RtsStatutoryPenalty.create({
      noticeNumber,
      complaintId,
      complaintTitle,
      ward,
      category,
      designatedOfficer: {
        officerId: `OFF-${officerEmployeeId}`,
        employeeId: officerEmployeeId,
        name: officerName,
        designation: officerDesignation,
        departmentCode: officerDepartment,
      },
      complainantCitizen: {
        citizenId: complainantCitizenId,
        name: complainantName,
        email: complainantEmail,
      },
      statutoryTimeLimitHours,
      elapsedHours,
      delayDays,
      dailyPenaltyRateInr: dailyRate,
      statutoryPenaltyCapInr: penaltyCap,
      totalPenaltyAmountInr: totalPenalty,
      status: "SHOW_CAUSE_ISSUED",
      hearingDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      appellateAuthority: "First Appellate Authority (Ward AMC)",
    });

    return penalty;
  }

  /**
   * Audits all open complaints in MongoDB and issues statutory notices for breaches
   */
  async auditOpenComplaintsForRts() {
    await this.ensureSeedData();

    const overdueComplaints = await Complaint.find({
      status: { $in: ["submitted", "ai_verified", "ward_assigned", "officer_assigned", "worker_assigned", "in_progress"] },
      isEscalated: true,
    }).lean();

    const createdNotices = [];

    for (const c of overdueComplaints) {
      const existing = await RtsStatutoryPenalty.findOne({ complaintId: c.complaintId || c._id.toString() });
      if (!existing) {
        const createdTime = new Date(c.createdAt || Date.now() - 48 * 3600 * 1000).getTime();
        const elapsedHours = (Date.now() - createdTime) / (3600 * 1000);

        if (elapsedHours > 24) {
          const notice = await this.issueStatutoryNotice({
            complaintId: c.complaintId || c._id.toString(),
            complaintTitle: c.title || "Municipal Public Service Defect",
            ward: c.ward || "Ward G-North",
            category: c.category || "roads_and_infrastructure",
            officerEmployeeId: c.assignedOfficer?.employeeId || "BMC-EE-4190",
            officerName: c.assignedOfficer?.name || "Executive Engineer (Vigilance)",
            officerDesignation: "Executive Engineer (EE)",
            officerDepartment: c.department || "PWD",
            complainantCitizenId: c.citizen ? c.citizen.toString() : "usr_citizen_demo_99",
            statutoryTimeLimitHours: 24,
            elapsedHours: Math.round(elapsedHours),
          });
          createdNotices.push(notice);
        }
      }
    }

    return createdNotices;
  }

  /**
   * First Appellate Authority Adjudication of RTS Show-Cause
   */
  async adjudicatePenalty(noticeNumber, decision, note = "Statutory hearing completed under Section 10", adjudicatedBy = "First Appellate Authority (Ward AMC)") {
    const penalty = await RtsStatutoryPenalty.findOne({ noticeNumber });
    if (!penalty) throw new Error(`RTS Notice ${noticeNumber} not found.`);

    if (decision === "SALARY_DEDUCTION_ENFORCED") {
      penalty.status = "SALARY_DEDUCTION_ENFORCED";
      penalty.adjudicationNote = `⚖️ SALARY DEDUCTION UPHELD: ₹${penalty.totalPenaltyAmountInr} deducted from monthly salary of ${penalty.designatedOfficer.name} (${penalty.designatedOfficer.employeeId}) for ${penalty.delayDays} day(s) statutory default. Note: ${note}`;
    } else if (decision === "FORCE_MAJEURE_EXCUSED") {
      penalty.status = "FORCE_MAJEURE_EXCUSED";
      penalty.adjudicationNote = `🛡️ FORCE MAJEURE ACCEPTED: Delay excused due to legitimate emergency conditions. Note: ${note}`;
    } else {
      throw new Error("Invalid adjudication decision. Must be SALARY_DEDUCTION_ENFORCED or FORCE_MAJEURE_EXCUSED.");
    }

    penalty.adjudicatedAt = new Date();
    penalty.adjudicatedBy = adjudicatedBy;
    await penalty.save();

    return penalty;
  }

  /**
   * Compensates the aggrieved citizen directly from the recovered statutory penalty pool
   */
  async compensateAggrievedCitizen(noticeNumber) {
    const penalty = await RtsStatutoryPenalty.findOne({ noticeNumber });
    if (!penalty) throw new Error(`RTS Notice ${noticeNumber} not found.`);

    if (penalty.status !== "SALARY_DEDUCTION_ENFORCED") {
      throw new Error(`Cannot disburse compensation. Notice status is ${penalty.status}; salary deduction must be confirmed first.`);
    }

    const voucherCode = `VCH-RTS-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    penalty.status = "CITIZEN_COMPENSATED";
    penalty.citizenCompensationPaidInr = penalty.totalPenaltyAmountInr;
    penalty.citizenCompensationVoucher = voucherCode;
    penalty.compensatedAt = new Date();
    await penalty.save();

    // Reward citizen with Karma points in User model
    if (penalty.complainantCitizen?.citizenId) {
      try {
        const user = await User.findById(penalty.complainantCitizen.citizenId);
        if (user) {
          const karmaBonus = Math.round(penalty.totalPenaltyAmountInr / 10); // e.g. ₹1,000 = +100 Karma
          user.karmaPoints = (user.karmaPoints || 0) + karmaBonus;
          await user.save();
        }
      } catch {
        // continue if guest
      }
    }

    return penalty;
  }

  /**
   * Returns aggregated RTS penalty and citizen compensation summary
   */
  async getRtsSummary() {
    await this.ensureSeedData();

    const globalTotals = await RtsStatutoryPenalty.aggregate([
      {
        $group: {
          _id: null,
          totalNotices: { $sum: 1 },
          totalPenaltyAssessedInr: { $sum: "$totalPenaltyAmountInr" },
          totalSalaryDeductedInr: {
            $sum: {
              $cond: [
                { $in: ["$status", ["SALARY_DEDUCTION_ENFORCED", "CITIZEN_COMPENSATED"]] },
                "$totalPenaltyAmountInr",
                0,
              ],
            },
          },
          totalCitizenCompensationDisbursedInr: { $sum: "$citizenCompensationPaidInr" },
          activeShowCausesCount: {
            $sum: { $cond: [{ $eq: ["$status", "SHOW_CAUSE_ISSUED"] }, 1, 0] },
          },
        },
      },
    ]);

    const wardBreakdown = await RtsStatutoryPenalty.aggregate([
      {
        $group: {
          _id: "$ward",
          noticesCount: { $sum: 1 },
          salaryDeductedInr: {
            $sum: {
              $cond: [
                { $in: ["$status", ["SALARY_DEDUCTION_ENFORCED", "CITIZEN_COMPENSATED"]] },
                "$totalPenaltyAmountInr",
                0,
              ],
            },
          },
          compensationDisbursedInr: { $sum: "$citizenCompensationPaidInr" },
        },
      },
      { $sort: { salaryDeductedInr: -1 } },
    ]);

    return {
      global: globalTotals[0] || {
        totalNotices: 0,
        totalPenaltyAssessedInr: 0,
        totalSalaryDeductedInr: 0,
        totalCitizenCompensationDisbursedInr: 0,
        activeShowCausesCount: 0,
      },
      wardBreakdown,
    };
  }

  /**
   * Fetches all RTS penalty records with optional filters
   */
  async getAllPenalties(filter = {}) {
    await this.ensureSeedData();
    return RtsStatutoryPenalty.find(filter).sort({ createdAt: -1 }).lean();
  }

  /**
   * Seed realistic initial RTS statutory records
   */
  async ensureSeedData() {
    const count = await RtsStatutoryPenalty.countDocuments();
    if (count > 0) return;

    const seedEntries = [
      {
        noticeNumber: "RTS-2026-GN-1049",
        complaintId: "SC-2026-8812",
        complaintTitle: "Contaminated Drinking Water Line at Shivaji Park",
        ward: "Ward G-North",
        category: "water_and_sanitation",
        designatedOfficer: {
          officerId: "OFF-BMC-EE-8812",
          employeeId: "BMC-EE-8812",
          name: "Shri. Rajesh Patil",
          designation: "Executive Engineer (EE)",
          departmentCode: "WSD",
        },
        complainantCitizen: {
          citizenId: "usr_citizen_demo_99",
          name: "Adv. Ramesh Varma",
          email: "citizen@mumbai.gov.in",
        },
        statutoryTimeLimitHours: 24,
        elapsedHours: 96,
        delayDays: 3,
        dailyPenaltyRateInr: 250,
        statutoryPenaltyCapInr: 5000,
        totalPenaltyAmountInr: 750,
        status: "CITIZEN_COMPENSATED",
        appellateAuthority: "First Appellate Authority (Ward AMC)",
        adjudicationNote: "Statutory default established without force majeure. ₹750 deducted from July salary.",
        adjudicatedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        adjudicatedBy: "Dr. Sanjay Shinde (Ward AMC)",
        citizenCompensationPaidInr: 750,
        citizenCompensationVoucher: "VCH-RTS-A4B92C",
        compensatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      },
      {
        noticeNumber: "RTS-2026-HW-2194",
        complaintId: "SC-2026-9041",
        complaintTitle: "Hazardous Deep Sinkhole on Linking Road Khar",
        ward: "Ward H-West",
        category: "roads_and_infrastructure",
        designatedOfficer: {
          officerId: "OFF-BMC-EE-9041",
          employeeId: "BMC-EE-9041",
          name: "Smt. Neha Kulkarni",
          designation: "Executive Engineer (EE)",
          departmentCode: "PWD",
        },
        complainantCitizen: {
          citizenId: "usr_citizen_demo_99",
          name: "Farhan Merchant",
          email: "farhan@mumbai.gov.in",
        },
        statutoryTimeLimitHours: 24,
        elapsedHours: 120,
        delayDays: 4,
        dailyPenaltyRateInr: 250,
        statutoryPenaltyCapInr: 5000,
        totalPenaltyAmountInr: 1000,
        status: "SALARY_DEDUCTION_ENFORCED",
        appellateAuthority: "First Appellate Authority (Ward AMC)",
        adjudicationNote: "Contractor material supply delay rejected as valid defense. Penalty imposed under Section 10.",
        adjudicatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        adjudicatedBy: "Shri. Vinayak Tambe (Ward AMC)",
      },
      {
        noticeNumber: "RTS-2026-GS-3382",
        complaintId: "SC-2026-7731",
        complaintTitle: "Collapsed Storm Water Nullah Slab at Worli Naka",
        ward: "Ward G-South",
        category: "storm_water_drains",
        designatedOfficer: {
          officerId: "OFF-BMC-EE-7731",
          employeeId: "BMC-EE-7731",
          name: "Shri. Amit Sawant",
          designation: "Executive Engineer (EE)",
          departmentCode: "SWD",
        },
        complainantCitizen: {
          citizenId: "usr_citizen_demo_99",
          name: "Meera Sen",
          email: "meera@mumbai.gov.in",
        },
        statutoryTimeLimitHours: 24,
        elapsedHours: 72,
        delayDays: 2,
        dailyPenaltyRateInr: 250,
        statutoryPenaltyCapInr: 5000,
        totalPenaltyAmountInr: 500,
        status: "SHOW_CAUSE_ISSUED",
        appellateAuthority: "First Appellate Authority (Ward AMC)",
      },
      {
        noticeNumber: "RTS-2026-KE-4819",
        complaintId: "SC-2026-5520",
        complaintTitle: "Chronic SWM Garbage Dump Overflow in Chakala",
        ward: "Ward K-East",
        category: "solid_waste_management",
        designatedOfficer: {
          officerId: "OFF-BMC-EE-5520",
          employeeId: "BMC-EE-5520",
          name: "Shri. Dattatray Shirodkar",
          designation: "Executive Engineer (EE)",
          departmentCode: "SWM",
        },
        complainantCitizen: {
          citizenId: "usr_citizen_demo_99",
          name: "Karan Johar",
          email: "karan@mumbai.gov.in",
        },
        statutoryTimeLimitHours: 12,
        elapsedHours: 60,
        delayDays: 2,
        dailyPenaltyRateInr: 250,
        statutoryPenaltyCapInr: 5000,
        totalPenaltyAmountInr: 500,
        status: "SHOW_CAUSE_ISSUED",
        appellateAuthority: "First Appellate Authority (Ward AMC)",
      },
    ];

    for (const item of seedEntries) {
      await RtsStatutoryPenalty.create(item);
    }
  }
}

module.exports = new RtsEnforcementService();
