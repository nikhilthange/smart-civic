"use strict";

const mongoose = require("mongoose");

const constructionSiteSchema = new mongoose.Schema(
  {
    siteId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    developerName: {
      type: String,
      required: true,
      trim: true,
    },
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    reraPermitNo: {
      type: String,
      required: true,
      index: true,
    },
    ward: {
      type: String,
      required: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
    },
    has35FtBarricadeCompliance: {
      type: Boolean,
      default: true,
    },
    hasWheelWashBasin: {
      type: Boolean,
      default: true,
    },
    hasAntiSmogGun: {
      type: Boolean,
      default: true,
    },
    currentPm10: {
      type: Number,
      default: 85,
    },
    currentPm25: {
      type: Number,
      default: 42,
    },
    pm10ExceedanceDurationMinutes: {
      type: Number,
      default: 0,
    },
    stopWorkNoticeIssued: {
      type: Boolean,
      default: false,
    },
    totalPenaltiesLeviedInr: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["COMPLIANT", "AIR_QUALITY_BREACH", "STOP_WORK_NOTICE_ACTIVE", "UNDER_AUDIT"],
      default: "COMPLIANT",
    },
    lastAuditedAt: {
      type: Date,
      default: Date.now,
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

constructionSiteSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("ConstructionSite", constructionSiteSchema);
