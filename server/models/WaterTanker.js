"use strict";

const mongoose = require("mongoose");

const waterTankerSchema = new mongoose.Schema(
  {
    tripPassId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    tankerRegistrationNo: {
      type: String,
      required: true,
      trim: true,
    },
    driverName: {
      type: String,
      required: true,
    },
    driverMobile: {
      type: String,
      required: true,
    },
    capacityLiters: {
      type: Number,
      default: 10000,
    },
    fillingStationName: {
      type: String,
      required: true,
      default: "Bhandup Master Water Treatment Facility",
    },
    destinationSociety: {
      type: String,
      required: true,
    },
    destinationWard: {
      type: String,
      required: true,
    },
    maxCappedRateInr: {
      type: Number,
      default: 1800,
    },
    qrSignatureHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["DISPATCHED", "DELIVERED", "DIVERTED_THEFT_FLAG"],
      default: "DISPATCHED",
    },
    dispatchedAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WaterTanker", waterTankerSchema);
