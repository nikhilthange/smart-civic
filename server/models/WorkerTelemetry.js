const mongoose = require("mongoose");

const workerTelemetrySchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    workerName: {
      type: String,
      default: "BMC Road Maintenance Crew #14",
    },
    vehicleType: {
      type: String,
      enum: ["JETPATCHER_TRUCK", "SWM_COMPACTOR", "SWD_SUCTION_JET", "ELEC_BOOM_LIFT", "RAPID_RESPONSE_VAN"],
      default: "RAPID_RESPONSE_VAN",
    },
    vehiclePlate: {
      type: String,
      default: "MH-01-CP-8842",
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [72.8350, 19.0550],
      },
    },
    heading: {
      type: Number,
      default: 45, // degrees
    },
    speedKmph: {
      type: Number,
      default: 28,
    },
    activeTicketId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["EN_ROUTE_TO_SITE", "ON_SITE_REPAIRING", "RETURNING_TO_DEPOT", "STANDBY"],
      default: "EN_ROUTE_TO_SITE",
    },
    lastPingAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkerTelemetry", workerTelemetrySchema);
