const mongoose = require("mongoose");

const greenBondSchema = new mongoose.Schema(
  {
    bondId: {
      type: String,
      required: true,
      unique: true,
    },
    seriesName: {
      type: String,
      required: true,
    },
    totalIssueSizeCr: {
      type: Number,
      required: true,
    },
    couponRatePct: {
      type: Number,
      default: 7.25,
    },
    tenureYears: {
      type: Number,
      default: 10,
    },
    creditRating: {
      type: String,
      default: "CRISIL AA+ (SO) / CARE AA+",
    },
    allocatedCapExCr: {
      type: Number,
      default: 0,
    },
    unallocatedBalanceCr: {
      type: Number,
      default: 0,
    },
    carbonOffsetAnnualTons: {
      type: Number,
      default: 14500,
    },
    targetWardAllocations: [
      {
        ward: String,
        projectCategory: String,
        allocatedAmountCr: Number,
        expectedCompletionDate: Date,
      },
    ],
    status: {
      type: String,
      enum: ["ACTIVE_SUBSCRIBED", "ALLOCATION_IN_PROGRESS", "MATURED"],
      default: "ACTIVE_SUBSCRIBED",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GreenBond", greenBondSchema);
