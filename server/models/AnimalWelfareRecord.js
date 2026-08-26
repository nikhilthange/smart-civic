"use strict";

const mongoose = require("mongoose");

const animalWelfareRecordSchema = new mongoose.Schema(
  {
    recordId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    locality: {
      type: String,
      required: true,
    },
    animalType: {
      type: String,
      enum: ["CANINE_STRAY", "BOVINE_CATTLE"],
      default: "CANINE_STRAY",
    },
    sterilizationStatus: {
      type: String,
      enum: ["STERILIZED_EAR_NOTCHED", "UNSTERILIZED", "PENDING_ABC_SLOT"],
      default: "UNSTERILIZED",
    },
    rfidMicrochipId: {
      type: String,
      default: "",
    },
    lastRabiesVaccinationDate: {
      type: Date,
    },
    packAggressionScore: {
      type: Number,
      default: 45,
    },
    reportedDogBites30Days: {
      type: Number,
      default: 8,
    },
    cattleImpoundStatus: {
      type: String,
      enum: ["NONE", "ROAMING_FREE_ROAD_HAZARD", "IMPOUNDED_IN_MUNICIPAL_CORRAL"],
      default: "NONE",
    },
    riskLevel: {
      type: String,
      enum: ["LOW_WATCH", "MODERATE_INTERVENTION", "CRITICAL_RABIES_SURGE"],
      default: "MODERATE_INTERVENTION",
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

animalWelfareRecordSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("AnimalWelfareRecord", animalWelfareRecordSchema);
