"use strict";

const mongoose = require("mongoose");

const dilapidatedBuildingSchema = new mongoose.Schema(
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
    structuralCategory: {
      type: String,
      enum: [
        "C1_DEMOLISH_IMMEDIATE",
        "C2A_MAJOR_REPAIRS_EVACUATE",
        "C2B_STRUCTURAL_REPAIR",
        "C3_MINOR_REPAIR",
      ],
      default: "C1_DEMOLISH_IMMEDIATE",
    },
    occupancyStatus: {
      type: String,
      enum: ["OCCUPIED", "PARTIALLY_EVACUATED", "FULLY_EVACUATED", "DEMOLISHED"],
      default: "OCCUPIED",
    },
    residentFamilyCount: {
      type: Number,
      required: true,
      default: 24,
    },
    tiltAngleDegrees: {
      type: Number,
      default: 0.8,
    },
    crackDisplacementMm: {
      type: Number,
      default: 4.2,
    },
    vibrationIndexHz: {
      type: Number,
      default: 2.1,
    },
    status: {
      type: String,
      enum: [
        "STABLE_MONITORED",
        "ELEVATED_VIBRATION",
        "IMMINENT_COLLAPSE_HAZARD",
        "EVACUATED_SECURED",
      ],
      default: "STABLE_MONITORED",
    },
    transitCampAllocated: {
      type: Boolean,
      default: false,
    },
    transitCampLocation: {
      type: String,
      default: "Mahul BMC Transit Camp Sector 4",
    },
    lastTelemetryAt: {
      type: Date,
      default: Date.now,
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

dilapidatedBuildingSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("DilapidatedBuilding", dilapidatedBuildingSchema);
