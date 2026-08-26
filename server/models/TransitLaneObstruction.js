"use strict";

const mongoose = require("mongoose");

const transitLaneObstructionSchema = new mongoose.Schema(
  {
    obstructionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    bestBusVehicleId: {
      type: String,
      required: true,
      default: "MH-01-AP-4091",
    },
    routeCorridorName: {
      type: String,
      required: true,
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    vehiclePlateNo: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ["PRIVATE_CAR", "AUTO_RICKSHAW", "COMMERCIAL_TRUCK", "TWO_WHEELER"],
      default: "PRIVATE_CAR",
    },
    challanAmountInr: {
      type: Number,
      required: true,
      default: 1500,
    },
    transitDelaySeconds: {
      type: Number,
      default: 140,
    },
    towingVehicleDispatched: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["CHALLAN_ISSUED", "TOWING_DISPATCHED", "PENALTY_PAID"],
      default: "CHALLAN_ISSUED",
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

transitLaneObstructionSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("TransitLaneObstruction", transitLaneObstructionSchema);
