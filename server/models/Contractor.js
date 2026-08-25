"use strict";

const mongoose = require("mongoose");

const ContractorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Contractor company/entity name is required"],
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    departmentCode: {
      type: String,
      trim: true,
      uppercase: true,
      enum: ["PWD", "SWM", "SWD", "WSD", "PRD", "ELD", "PHD", "LIC", "PSD", "GEN"],
    },
    assignedWards: {
      type: [String],
      default: ["Ward A", "Ward H-West", "Ward G-South"],
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
    },
    totalJobs: {
      type: Number,
      default: 0,
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    slaBreaches: {
      type: Number,
      default: 0,
    },
    accumulatedPenalties: {
      type: Number,
      default: 0,
    },
    escrowBalance: {
      type: Number,
      default: 500000, // ₹5,00,000 Municipal Escrow Deposit
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Contractor", ContractorSchema);
