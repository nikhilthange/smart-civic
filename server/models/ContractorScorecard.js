const mongoose = require("mongoose");

const contractorScorecardSchema = new mongoose.Schema(
  {
    contractorId: {
      type: String,
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    authorizedContact: {
      type: String,
      default: "Kishore Mehta (MD)",
    },
    phone: {
      type: String,
      default: "+91 98201 11223",
    },
    wardAllocation: [String],
    activeWorkOrdersCount: {
      type: Number,
      default: 12,
    },
    completedWorkOrdersCount: {
      type: Number,
      default: 84,
    },
    escrowBalanceInr: {
      type: Number,
      default: 2500000, // ₹25 Lakhs
    },
    frozenEscrowInr: {
      type: Number,
      default: 0,
    },
    strikesCount: {
      type: Number,
      default: 0, // 0 to 3
    },
    strikeLogs: [
      {
        strikeNumber: Number,
        complaintId: String,
        reason: String,
        upheldBy: String,
        issuedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    znccAverageConfidence: {
      type: Number,
      default: 91.4, // %
    },
    reliabilityScore: {
      type: Number,
      default: 94, // 0-100
    },
    status: {
      type: String,
      enum: ["ACTIVE_GOOD_STANDING", "UNDER_PROBATION", "BLACKLISTED_FROZEN"],
      default: "ACTIVE_GOOD_STANDING",
    },
    statutoryDebarmentOrder: {
      orderNumber: String,
      issuedAt: Date,
      legalSection: String,
    },
  },
  {
    timestamps: true,
  }
);

contractorScorecardSchema.index({ contractorId: 1, strikesCount: -1 });
contractorScorecardSchema.index({ status: 1, reliabilityScore: -1 });

module.exports = mongoose.model("ContractorScorecard", contractorScorecardSchema);
