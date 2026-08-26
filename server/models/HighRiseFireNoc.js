"use strict";

const mongoose = require("mongoose");

const highRiseFireNocSchema = new mongoose.Schema(
  {
    buildingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    buildingName: {
      type: String,
      required: true,
      trim: true,
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
    },
    floorCount: {
      type: Number,
      required: true,
      default: 28,
    },
    propertyTaxSacId: {
      type: String,
      required: true,
      index: true,
    },
    fireNocExpiryDate: {
      type: Date,
      required: true,
    },
    fireNocStatus: {
      type: String,
      enum: ["VALID", "EXPIRED", "AUDIT_CITATION_ISSUED"],
      default: "VALID",
    },
    wetRiserPressureKgCm2: {
      type: Number,
      default: 4.8, // Statutory minimum: 3.5 kg/cm²
    },
    pressureLossDurationMinutes: {
      type: Number,
      default: 0,
    },
    refugeFloorEncroached: {
      type: Boolean,
      default: false,
    },
    sprinklerSystemActive: {
      type: Boolean,
      default: true,
    },
    mfbRadarFlagged: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["OPERATIONAL", "DRY_RISER_FAILURE_CRITICAL", "REFUGE_BLOCKED_VIOLATION"],
      default: "OPERATIONAL",
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

highRiseFireNocSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("HighRiseFireNoc", highRiseFireNocSchema);
