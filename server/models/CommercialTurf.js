"use strict";

const mongoose = require("mongoose");

const commercialTurfSchema = new mongoose.Schema(
  {
    venueId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    venueName: {
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
    operatingLicenseStatus: {
      type: String,
      enum: ["ACTIVE", "UNDER_INSPECTION", "SUSPENDED", "UNLICENSED"],
      default: "ACTIVE",
    },
    permittedCutoffHour: {
      type: Number,
      default: 22, // 22:00 IST (10:00 PM)
    },
    lastRecordedDecibels: {
      type: Number,
      default: 52,
    },
    lastRecordedLux: {
      type: Number,
      default: 180,
    },
    totalViolationsCount: {
      type: Number,
      default: 0,
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

commercialTurfSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("CommercialTurf", commercialTurfSchema);
