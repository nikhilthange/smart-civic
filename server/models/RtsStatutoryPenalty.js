"use strict";

const mongoose = require("mongoose");
const crypto = require("crypto");

const RtsStatutoryPenaltySchema = new mongoose.Schema(
  {
    noticeNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    complaintId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    complaintTitle: {
      type: String,
      required: true,
      trim: true,
    },
    ward: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    category: {
      type: String,
      default: "roads_and_infrastructure",
    },
    designatedOfficer: {
      officerId: { type: String, required: true },
      employeeId: { type: String, required: true },
      name: { type: String, required: true },
      designation: { type: String, default: "Executive Engineer (EE)" },
      departmentCode: { type: String, default: "PWD" },
    },
    complainantCitizen: {
      citizenId: { type: String, default: "usr_citizen_demo_99" },
      name: { type: String, default: "Ward Citizen" },
      email: { type: String, default: "citizen@mumbai.gov.in" },
    },
    statutoryTimeLimitHours: {
      type: Number,
      required: true,
      default: 24, // Statutory resolution window under RTS Act Schedule I
    },
    elapsedHours: {
      type: Number,
      required: true,
      default: 48,
    },
    delayDays: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    dailyPenaltyRateInr: {
      type: Number,
      default: 250, // Section 10 of Maharashtra RTS Act 2015: ₹250/day
    },
    statutoryPenaltyCapInr: {
      type: Number,
      default: 5000, // Section 10 cap: ₹5,000 maximum per default
    },
    totalPenaltyAmountInr: {
      type: Number,
      required: true,
      default: 250,
    },
    status: {
      type: String,
      enum: [
        "SHOW_CAUSE_ISSUED",
        "SALARY_DEDUCTION_ENFORCED",
        "CITIZEN_COMPENSATED",
        "FORCE_MAJEURE_EXCUSED",
      ],
      default: "SHOW_CAUSE_ISSUED",
      index: true,
    },
    appellateAuthority: {
      type: String,
      default: "First Appellate Authority (Ward AMC)",
    },
    hearingDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7-day statutory hearing
    },
    adjudicationNote: {
      type: String,
      default: null,
    },
    adjudicatedAt: {
      type: Date,
      default: null,
    },
    adjudicatedBy: {
      type: String,
      default: null,
    },
    citizenCompensationPaidInr: {
      type: Number,
      default: 0,
    },
    citizenCompensationVoucher: {
      type: String,
      default: null,
    },
    compensatedAt: {
      type: Date,
      default: null,
    },
    legalNoticeHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save cryptographic digital seal
RtsStatutoryPenaltySchema.pre("save", function () {
  if (!this.legalNoticeHash) {
    const raw = `${this.noticeNumber}-${this.complaintId}-${this.totalPenaltyAmountInr}-${this.createdAt || Date.now()}`;
    this.legalNoticeHash = crypto.createHash("sha256").update(raw).digest("hex");
  }
});

RtsStatutoryPenaltySchema.index({ ward: 1, status: 1 });
RtsStatutoryPenaltySchema.index({ "designatedOfficer.employeeId": 1 });

module.exports = mongoose.model("RtsStatutoryPenalty", RtsStatutoryPenaltySchema);
