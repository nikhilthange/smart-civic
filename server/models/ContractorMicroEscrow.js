"use strict";

const mongoose = require("mongoose");
const crypto = require("crypto");

const ContractorMicroEscrowSchema = new mongoose.Schema(
  {
    escrowId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    contractorId: {
      type: String,
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    complaintId: {
      type: String,
      required: true,
      index: true,
    },
    complaintTitle: {
      type: String,
      default: "Municipal Defect Remediation",
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      default: "roads_and_infrastructure",
    },
    collateralAmountInr: {
      type: Number,
      default: 5000,
      min: 1000,
    },
    releasedAmountInr: {
      type: Number,
      default: 0,
    },
    dlpRetainedAmountInr: {
      type: Number,
      default: 0,
    },
    slashedAmountInr: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "ALLOCATED_HELD",
        "PARTIALLY_RELEASED_DLP_LOCKED",
        "FULL_RELEASED",
        "SLASHED_TO_CITIZEN_POOL",
      ],
      default: "ALLOCATED_HELD",
      index: true,
    },
    znccConfidenceScore: {
      type: Number,
      default: null,
    },
    citizenDisputeCount: {
      type: Number,
      default: 0,
    },
    slashedReason: {
      type: String,
      default: null,
    },
    slashedAt: {
      type: Date,
      default: null,
    },
    dlpReleaseDate: {
      type: Date,
      default: null,
    },
    transactionHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate SHA-256 hash before saving
ContractorMicroEscrowSchema.pre("save", function () {
  const payload = `${this.escrowId}|${this.contractorId}|${this.collateralAmountInr}|${this.status}|${this.slashedAmountInr}|${this.updatedAt || Date.now()}`;
  this.transactionHash = crypto.createHash("sha256").update(payload).digest("hex");
});

module.exports = mongoose.model("ContractorMicroEscrow", ContractorMicroEscrowSchema);
