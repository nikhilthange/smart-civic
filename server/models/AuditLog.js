"use strict";

const mongoose = require("mongoose");
const crypto = require("crypto");

const auditLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        "ESCROW_PENALTY_DEDUCTION",
        "DLP_WARRANTY_BLOCK",
        "STOP_WORK_INJUNCTION_ISSUED",
        "TRANSIT_CAMP_ALLOCATION",
        "FIRE_SAFETY_CITATION",
        "AQI_FINE_LEVIED",
        "SUBWAY_FLOOD_CLOSURE",
        "ANPR_CHALLAN_ISSUED",
      ],
      index: true,
    },
    actorId: {
      type: String,
      required: true,
      default: "SYSTEM_AUTONOMOUS_DAEMON",
    },
    actorRole: {
      type: String,
      required: true,
      default: "SYSTEM",
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    targetEntityId: {
      type: String,
      required: true,
    },
    targetEntityType: {
      type: String,
      required: true,
    },
    payloadSummary: {
      type: String,
      required: true,
    },
    amountInr: {
      type: Number,
      default: 0,
    },
    previousHash: {
      type: String,
      required: true,
      default: "0000000000000000000000000000000000000000000000000000000000000000",
    },
    currentHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
