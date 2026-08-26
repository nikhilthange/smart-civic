"use strict";

const mongoose = require("mongoose");

const hawkingZoneSchema = new mongoose.Schema(
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
    zoneType: {
      type: String,
      enum: ["NON_HAWKING_ZONE", "DESIGNATED_HAWKING_ZONE", "RESTRICTED_TIMED_ZONE"],
      default: "NON_HAWKING_ZONE",
    },
    restrictionReason: {
      type: String,
      default: "150-Meter Statutory Buffer from Suburban Railway Station / Hospital",
    },
    authorizedStallCapacity: {
      type: Number,
      default: 0, // 0 for Non-Hawking
    },
    geometry: {
      type: {
        type: String,
        enum: ["Polygon", "Point"],
        default: "Point",
      },
      coordinates: {
        type: Array,
        required: true,
      },
    },
  },
  { timestamps: true }
);

hawkingZoneSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("HawkingZone", hawkingZoneSchema);
