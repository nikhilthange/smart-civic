"use strict";

const mongoose = require("mongoose");

const trenchingPermitSchema = new mongoose.Schema(
  {
    permitId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    agencyName: {
      type: String,
      required: true,
      enum: [
        "Adani Electricity Mumbai Ltd (AEML)",
        "Mahanagar Gas Ltd (MGL)",
        "Tata Power Company",
        "Airtel Telesonic Optical Fiber",
        "Jio Digital Fiber Pvt Ltd",
        "BMC Hydraulic Engineering Department",
        "BMC Storm Water Drains (SWD)",
      ],
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    roadName: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    estimatedLengthMeters: {
      type: Number,
      required: true,
      min: 5,
    },
    reinstatementBondAmountInr: {
      type: Number,
      required: true,
      default: 500000,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING_COORDINATION",
        "JOINT_TRENCHING_MERGED",
        "APPROVED",
        "DLP_BLOCKED",
        "IN_PROGRESS",
        "REINSTATED",
        "REJECTED",
      ],
      default: "PENDING_COORDINATION",
    },
    isJointTrenching: {
      type: Boolean,
      default: false,
    },
    coordinatingAgencies: [
      {
        type: String,
      },
    ],
    sharedCostSavingsInr: {
      type: Number,
      default: 0,
    },
    dlpCheckPassed: {
      type: Boolean,
      default: true,
    },
    dlpConflictRoadName: {
      type: String,
      default: "",
    },
    geometry: {
      type: {
        type: String,
        enum: ["LineString", "Point"],
        default: "LineString",
      },
      coordinates: {
        type: Array,
        required: true,
      },
    },
  },
  { timestamps: true }
);

trenchingPermitSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("TrenchingPermit", trenchingPermitSchema);
