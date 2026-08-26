"use strict";

const mongoose = require("mongoose");

const wardProjectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "SOLAR_STREETLIGHTS",
        "PUBLIC_PARK_RESTORATION",
        "FOOT_OVER_BRIDGE",
        "WOMEN_PUBLIC_SANITATION",
        "RAINWATER_HARVESTING",
        "PEDESTRIAN_FOOTPATH_UPGRADE",
      ],
      default: "SOLAR_STREETLIGHTS",
    },
    estimatedBudgetInr: {
      type: Number,
      required: true,
      default: 3500000, // ₹35 Lakhs
    },
    fundsDisbursedInr: {
      type: Number,
      default: 0,
    },
    allocatedFiscalYear: {
      type: String,
      default: "2026-2027",
    },
    votesCount: {
      type: Number,
      default: 0,
    },
    votersList: [
      {
        userId: { type: String },
        votedAt: { type: Date, default: Date.now },
        quarter: { type: String, default: "Q2-2026" },
      },
    ],
    corporatorName: {
      type: String,
      default: "Hon. Ward Corporator (BMC)",
    },
    status: {
      type: String,
      enum: [
        "PROPOSED",
        "CITIZEN_APPROVED",
        "TENDER_FLOATED",
        "IN_EXECUTION",
        "COMPLETED",
        "REJECTED",
      ],
      default: "PROPOSED",
    },
    estimatedBeneficiaryCitizens: {
      type: Number,
      default: 25000,
    },
    targetCompletionDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WardProject", wardProjectSchema);
