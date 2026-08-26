"use strict";

const mongoose = require("mongoose");

const waterFlowZoneSchema = new mongoose.Schema(
  {
    zoneId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    zoneName: {
      type: String,
      required: true,
      trim: true,
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    masterReservoirInflowMld: {
      type: Number,
      required: true,
      default: 45.0, // Million Liters per Day
    },
    aggregateDmaOutflowMld: {
      type: Number,
      required: true,
      default: 34.5,
    },
    lossPercentage: {
      type: Number,
      default: 23.3,
    },
    status: {
      type: String,
      enum: ["NORMAL", "MODERATE_LOSS", "CRITICAL_PIPELINE_THEFT_LEAK"],
      default: "NORMAL",
    },
    pipelinePressurePsi: {
      type: Number,
      default: 38.5,
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

module.exports = mongoose.model("WaterFlowZone", waterFlowZoneSchema);
