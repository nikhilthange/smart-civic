"use strict";

const asyncHandler = require("express-async-handler");
const CommercialTurf = require("../models/CommercialTurf");
const { auditTurfViolation } = require("../services/noiseMonitorService");

const DEFAULT_TURFS = [
  {
    venueId: "TRF-HW-01",
    venueName: "Kick-Off Rooftop Football Turf",
    ward: "Ward H-West",
    address: "Bandra West Hill Road Terrace",
    operatingLicenseStatus: "UNDER_INSPECTION",
    permittedCutoffHour: 22,
    lastRecordedDecibels: 68,
    lastRecordedLux: 310,
    totalViolationsCount: 3,
    location: {
      type: "Point",
      coordinates: [72.8340, 19.0560],
    },
  },
  {
    venueId: "TRF-GN-02",
    venueName: "Shivaji Park Box Cricket Arena",
    ward: "Ward G-North",
    address: "Near Plaza Cinema, Dadar West",
    operatingLicenseStatus: "ACTIVE",
    permittedCutoffHour: 22,
    lastRecordedDecibels: 51,
    lastRecordedLux: 160,
    totalViolationsCount: 0,
    location: {
      type: "Point",
      coordinates: [72.8410, 19.0230],
    },
  },
  {
    venueId: "TRF-KW-03",
    venueName: "Lokhandwala Champions Multi-Sport Turf",
    ward: "Ward K-West",
    address: "Back Road, Lokhandwala Complex, Andheri West",
    operatingLicenseStatus: "ACTIVE",
    permittedCutoffHour: 22,
    lastRecordedDecibels: 54,
    lastRecordedLux: 190,
    totalViolationsCount: 1,
    location: {
      type: "Point",
      coordinates: [72.8255, 19.1410],
    },
  },
];

/**
 * @route   GET /api/turf/venues
 * @desc    Get all commercial sports turfs and acoustic compliance statuses
 * @access  Public / Authenticated
 */
exports.getTurfVenues = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  let venues = await CommercialTurf.find(filter).sort({ totalViolationsCount: -1 });

  if (venues.length === 0) {
    venues = DEFAULT_TURFS.filter((t) => !ward || ward === "all" || t.ward === ward);
  }

  res.status(200).json({
    success: true,
    count: venues.length,
    venues,
  });
});

/**
 * @route   POST /api/turf/report-violation
 * @desc    Ingest citizen decibel log or sensor trigger, auto-flag police inspection
 * @access  Public / Authenticated
 */
exports.reportTurfViolation = asyncHandler(async (req, res) => {
  const {
    venueId = "TRF-HW-01",
    decibelsDba = 68,
    luxLevel = 340,
    timestamp = new Date(),
  } = req.body;

  const result = await auditTurfViolation({
    venueId,
    decibelsDba: Number(decibelsDba),
    luxLevel: Number(luxLevel),
    timestamp,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});
