"use strict";

const mongoose = require("mongoose");

const mangroveZoneSchema = new mongoose.Schema(
  {
    zoneId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    zoneName: {
      type: String,
      required: true,
      trim: true,
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    crzClassification: {
      type: String,
      default: "CRZ_I_ECOLOGICALLY_SENSITIVE",
    },
    baselineNdvi: {
      type: Number,
      default: 0.76, // Normalized Difference Vegetation Index (0 to 1.0)
    },
    currentNdvi: {
      type: Number,
      default: 0.52,
    },
    vegetationLossPercentage: {
      type: Number,
      default: 31.5,
    },
    debrisDumpingDetected: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["PROTECTED_HEALTHY", "MODERATE_DEPLETION", "CRITICAL_CRZ_DESTRUCTION"],
      default: "PROTECTED_HEALTHY",
    },
    injunctionNoticeIssued: {
      type: Boolean,
      default: false,
    },
    mangroveCellNotified: {
      type: Boolean,
      default: false,
    },
    geometry: {
      type: {
        type: String,
        enum: ["Polygon", "Point"],
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

mangroveZoneSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("MangroveZone", mangroveZoneSchema);
