"use strict";

const mongoose = require("mongoose");

const desiltingRecordSchema = new mongoose.Schema(
  {
    nullahId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    nullahName: {
      type: String,
      required: true,
      trim: true,
    },
    ward: {
      type: String,
      required: true,
      enum: [
        "Ward A", "Ward B", "Ward C", "Ward D", "Ward E",
        "Ward F-North", "Ward F-South", "Ward G-North", "Ward G-South",
        "Ward H-East", "Ward H-West", "Ward K-East", "Ward K-West",
        "Ward L", "Ward M-East", "Ward M-West", "Ward N",
        "Ward P-North", "Ward P-South", "Ward R-Central", "Ward R-North",
        "Ward R-South", "Ward S", "Ward T"
      ],
      index: true,
    },
    category: {
      type: String,
      enum: ["MAJOR_NULLAH", "MINOR_NULLAH", "ROADSIDE_DRAIN", "OUTFALL_CULVERT"],
      default: "MAJOR_NULLAH",
    },
    targetSiltTonnage: {
      type: Number,
      required: true,
      min: 0,
    },
    extractedSiltTonnage: {
      type: Number,
      default: 0,
      min: 0,
    },
    preDesiltingBedDepthMeters: {
      type: Number,
      required: true,
      default: 1.2,
    },
    postDesiltingBedDepthMeters: {
      type: Number,
      default: 1.2,
    },
    aiVerificationStatus: {
      type: String,
      enum: ["PENDING_SCAN", "VERIFIED_PASS", "DISCREPANCY_FLAGGED"],
      default: "PENDING_SCAN",
    },
    aiEstimatedDepthGainMeters: {
      type: Number,
      default: 0,
    },
    contractorId: {
      type: String,
      required: true,
    },
    contractorName: {
      type: String,
      default: "BMC SWD Empanelled Contractor",
    },
    preMonsoonPhotoUrl: {
      type: String,
      default: "",
    },
    postMonsoonPhotoUrl: {
      type: String,
      default: "",
    },
    streamLine: {
      type: {
        type: String,
        enum: ["LineString", "Point"],
        default: "LineString",
      },
      coordinates: {
        type: Array,
        default: [
          [72.8347, 19.0596],
          [72.8400, 19.0650],
        ],
      },
    },
    fiscalYear: {
      type: String,
      default: "2026-2027",
    },
  },
  { timestamps: true }
);

desiltingRecordSchema.index({ streamLine: "2dsphere" });

module.exports = mongoose.model("DesiltingRecord", desiltingRecordSchema);
