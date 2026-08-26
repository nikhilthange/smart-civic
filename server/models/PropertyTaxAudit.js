"use strict";

const mongoose = require("mongoose");

const propertyTaxAuditSchema = new mongoose.Schema(
  {
    propertySacNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    assessedCarpetAreaSqFt: {
      type: Number,
      required: true,
      default: 1200,
    },
    lidarMeasuredAreaSqFt: {
      type: Number,
      required: true,
      default: 1650,
    },
    discrepancyPercentage: {
      type: Number,
      default: 37.5,
    },
    permittedLandUse: {
      type: String,
      enum: ["RESIDENTIAL", "COMMERCIAL_AUTHORIZED", "INDUSTRIAL"],
      default: "RESIDENTIAL",
    },
    detectedActualUse: {
      type: String,
      enum: ["RESIDENTIAL", "COMMERCIAL_UNAUTHORIZED", "INDUSTRIAL_UNAUTHORIZED"],
      default: "COMMERCIAL_UNAUTHORIZED",
    },
    hasRooftopExtension: {
      type: Boolean,
      default: false,
    },
    estimatedTaxDeficitInr: {
      type: Number,
      default: 145000,
    },
    penaltyAmountInr: {
      type: Number,
      default: 290000, // 200% penalty
    },
    status: {
      type: String,
      enum: ["CLEAN_ASSESSMENT", "REVENUE_LEAKAGE_FLAGGED", "DEMAND_NOTICE_SERVED"],
      default: "REVENUE_LEAKAGE_FLAGGED",
    },
    demandNoticeServedAt: {
      type: Date,
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

propertyTaxAuditSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("PropertyTaxAudit", propertyTaxAuditSchema);
