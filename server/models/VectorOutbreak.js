"use strict";

const mongoose = require("mongoose");

const vectorOutbreakSchema = new mongoose.Schema(
  {
    clusterId: {
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
    locality: {
      type: String,
      required: true,
    },
    diseaseType: {
      type: String,
      enum: ["DENGUE", "MALARIA", "LEPTOSPIROSIS", "CHIKUNGUNYA"],
      default: "DENGUE",
    },
    reportedFeverCases: {
      type: Number,
      default: 12,
    },
    larvalBreedingIndex: {
      type: Number,
      default: 45, // Breteau Index / House Index
    },
    stagnantWaterGrievanceCount: {
      type: Number,
      default: 6,
    },
    riskScore: {
      type: Number,
      default: 65,
    },
    riskLevel: {
      type: String,
      enum: ["LOW", "MODERATE", "CRITICAL_EPIDEMIC_SURGE"],
      default: "MODERATE",
    },
    lastFoggedAt: {
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

vectorOutbreakSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("VectorOutbreak", vectorOutbreakSchema);
