const mongoose = require("mongoose");

const sitrepReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: String,
      required: true,
    },
    reportingPeriod: {
      type: String,
      default: "Past 24 Hours (00:00 - 23:59 IST)",
    },
    executiveSummary: {
      totalGrievancesIngested: Number,
      totalGrievancesResolved: Number,
      netResolutionVelocityPct: Number,
      averageResolutionHours: Number,
      criticalSlaBreaches: Number,
      citizenAppealsDisputed: Number,
      contractorEscrowFrozenInr: Number,
    },
    wardPerformanceBreakdown: [
      {
        ward: String,
        totalComplaints: Number,
        resolved: Number,
        compliancePct: Number,
        status: String,
      },
    ],
    monsoonAndDisasterTelemetry: {
      rainfallMax24hMm: Number,
      maxRainfallStation: String,
      highTideTime: String,
      swdPumpStationsActive: Number,
      subwaysWaterlogged: Number,
      subwayDetoursActive: Number,
    },
    auditAndFiscalEnforcement: {
      contractorStrikesIssuedToday: Number,
      activeDebarmentsCount: Number,
      propertyTaxRebatesApprovedInr: Number,
      greenBondCapExAllocatedInr: Number,
    },
    dutyOfficerSignature: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("SitrepReport", sitrepReportSchema);
