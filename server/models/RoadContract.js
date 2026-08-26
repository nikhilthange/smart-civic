"use strict";

const mongoose = require("mongoose");

const roadContractSchema = new mongoose.Schema(
  {
    contractId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    roadName: {
      type: String,
      required: true,
      trim: true,
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    contractorId: {
      type: String,
      required: true,
      index: true,
    },
    contractorName: {
      type: String,
      required: true,
    },
    surfaceType: {
      type: String,
      enum: ["ASPHALT_MACADAM", "MASTIC_ASPHALT", "CEMENT_CONCRETE", "PAVER_BLOCKS"],
      default: "MASTIC_ASPHALT",
    },
    completionDate: {
      type: Date,
      required: true,
    },
    dlpDurationMonths: {
      type: Number,
      default: 36, // Standard BMC 3-year Defect Liability Period
    },
    dlpExpiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    totalProjectCostInr: {
      type: Number,
      required: true,
      default: 25000000,
    },
    retentionFundAmountInr: {
      type: Number,
      required: true,
      default: 2500000, // 10% retention deposit
    },
    retentionFundFrozen: {
      type: Boolean,
      default: false,
    },
    activeDefectCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE_WARRANTY", "WARRANTY_EXPIRED", "PENALTY_LOCKED", "REPAIR_IN_PROGRESS"],
      default: "ACTIVE_WARRANTY",
    },
    geometry: {
      type: {
        type: String,
        enum: ["LineString", "Point"],
        default: "Point",
      },
      coordinates: {
        type: Array,
        required: true,
      },
    },
  },
  { timestamps: true }
);

roadContractSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("RoadContract", roadContractSchema);
