const mongoose = require("mongoose");

const emergencyBroadcastSchema = new mongoose.Schema(
  {
    broadcastId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ["FLASH_FLOOD_RED_ALERT", "SUBWAY_INUNDATION", "HIGH_TIDE_WARNING", "STRUCTURAL_COLLAPSE_EVAC", "AQI_SMOG_EMERGENCY"],
      default: "FLASH_FLOOD_RED_ALERT",
    },
    targetWard: {
      type: String,
      default: "ALL_24_WARDS",
    },
    bufferRadiusKm: {
      type: Number,
      default: 1.5,
    },
    channels: [
      {
        type: String,
        enum: ["WEB_PUSH", "WHATSAPP", "SMS_CELL_BROADCAST", "MCS_VARIABLE_MESSAGE_SIGNS"],
      },
    ],
    estimatedCitizenReachCount: {
      type: Number,
      default: 45000,
    },
    dispatchedBy: {
      type: String,
      default: "Disaster Management Cell (BMC HQ)",
    },
    dispatchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmergencyBroadcast", emergencyBroadcastSchema);
