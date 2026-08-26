"use strict";

const mongoose = require("mongoose");

const subwayStatusSchema = new mongoose.Schema(
  {
    subwayId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    subwayName: {
      type: String,
      required: true,
      trim: true,
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    waterDepthCm: {
      type: Number,
      default: 12,
    },
    criticalThresholdCm: {
      type: Number,
      default: 30, // 30cm flood barrier trigger
    },
    trafficStatus: {
      type: String,
      enum: ["OPEN", "RESTRICTED_SINGLE_LANE", "SUBMERGED_CLOSED"],
      default: "OPEN",
    },
    safeDetourCorridor: {
      type: String,
      required: true,
    },
    alternateFlyoverName: {
      type: String,
      required: true,
    },
    activePumpsCount: {
      type: Number,
      default: 4,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { timestamps: true }
);

subwayStatusSchema.index({ ward: 1, trafficStatus: 1 });
subwayStatusSchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model("SubwayStatus", subwayStatusSchema);
