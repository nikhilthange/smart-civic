"use strict";

const mongoose = require("mongoose");

const binTelemetrySchema = new mongoose.Schema(
  {
    binId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    rfidTag: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    locality: {
      type: String,
      required: true,
    },
    capacityLiters: {
      type: Number,
      default: 1100, // Standard 1.1m³ Euro bin
    },
    currentFillPercentage: {
      type: Number,
      default: 35,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["CLEANED", "NORMAL", "NEAR_FULL", "OVERFLOWING"],
      default: "NORMAL",
    },
    wasteType: {
      type: String,
      enum: ["WET_WASTE", "DRY_RECYCLABLE", "MIXED_MSW"],
      default: "MIXED_MSW",
    },
    lastLiftedAt: {
      type: Date,
      default: Date.now,
    },
    lastLiftTruckId: {
      type: String,
      default: "MH-01-CV-4081",
    },
    lastGrossWeightKg: {
      type: Number,
      default: 420,
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

binTelemetrySchema.index({ location: "2dsphere" });

module.exports = mongoose.model("BinTelemetry", binTelemetrySchema);
