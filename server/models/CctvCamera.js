"use strict";

const mongoose = require("mongoose");

const cctvCameraSchema = new mongoose.Schema(
  {
    cameraId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    cameraName: {
      type: String,
      required: true,
      trim: true,
    },
    junction: {
      type: String,
      required: true,
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    streamUrl: {
      type: String,
      default: "https://cctv.mumbaipolice.gov.in/live/stream.m3u8",
    },
    feedStatus: {
      type: String,
      enum: ["ONLINE_STREAMING", "OFFLINE_MAINTENANCE", "ANOMALY_FLAGGED"],
      default: "ONLINE_STREAMING",
    },
    activeAnalytics: [
      {
        type: String,
        enum: ["DEBRIS_DUMPING", "WATERLOGGING", "ILLEGAL_ENCROACHMENT", "TRAFFIC_GRIDLOCK"],
      },
    ],
    lastDetectedAnomaly: {
      anomalyType: String,
      confidence: Number,
      detectedAt: Date,
      autoComplaintId: String,
      boundingBox: [Number], // [x, y, w, h] %
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

cctvCameraSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("CctvCamera", cctvCameraSchema);
