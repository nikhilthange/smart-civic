"use strict";

const asyncHandler = require("express-async-handler");
const ConstructionSite = require("../models/ConstructionSite");
const {
  processAqiTelemetry,
  verifySiteBarricadeProof,
} = require("../services/aqiEnforcementService");

const DEFAULT_SITES = [
  {
    siteId: "SITE-GN-01",
    developerName: "Lodha Commercial Developers",
    projectName: "Lodha Supremus Tower B",
    reraPermitNo: "P51900028911",
    ward: "Ward G-North",
    address: "Senapati Bapat Marg, Lower Parel / Dadar",
    has35FtBarricadeCompliance: true,
    hasWheelWashBasin: true,
    hasAntiSmogGun: true,
    currentPm10: 92,
    currentPm25: 45,
    stopWorkNoticeIssued: false,
    totalPenaltiesLeviedInr: 0,
    status: "COMPLIANT",
    location: {
      type: "Point",
      coordinates: [72.8310, 19.0125],
    },
  },
  {
    siteId: "SITE-HW-02",
    developerName: "Rustomjee Luxury Estates",
    projectName: "Rustomjee Seasons Phase 3",
    reraPermitNo: "P51800010924",
    ward: "Ward H-West",
    address: "Bandra Reclamation Arterial",
    has35FtBarricadeCompliance: false,
    hasWheelWashBasin: false,
    hasAntiSmogGun: true,
    currentPm10: 184,
    currentPm25: 88,
    stopWorkNoticeIssued: true,
    totalPenaltiesLeviedInr: 50000,
    status: "STOP_WORK_NOTICE_ACTIVE",
    location: {
      type: "Point",
      coordinates: [72.8250, 19.0520],
    },
  },
  {
    siteId: "SITE-KW-03",
    developerName: "Oberoi Realty Ltd",
    projectName: "Oberoi Sky City Commercial",
    reraPermitNo: "P51800003582",
    ward: "Ward K-West",
    address: "New Link Road, Andheri West",
    has35FtBarricadeCompliance: true,
    hasWheelWashBasin: true,
    hasAntiSmogGun: false,
    currentPm10: 138,
    currentPm25: 64,
    stopWorkNoticeIssued: false,
    totalPenaltiesLeviedInr: 0,
    status: "UNDER_AUDIT",
    location: {
      type: "Point",
      coordinates: [72.8335, 19.1280],
    },
  },
];

/**
 * @route   GET /api/aqi/sites
 * @desc    Get all active construction sites and PM10/PM2.5 micro-sensor readings
 * @access  Public / Authenticated
 */
exports.getConstructionSites = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  let sites = await ConstructionSite.find(filter).sort({ currentPm10: -1 });

  if (sites.length === 0) {
    sites = DEFAULT_SITES.filter((s) => !ward || ward === "all" || s.ward === ward);
  }

  res.status(200).json({
    success: true,
    count: sites.length,
    sites,
  });
});

/**
 * @route   POST /api/aqi/telemetry
 * @desc    Ingests real-time PM10/PM2.5 sensor reading, triggers stop-work notices and fines
 * @access  Public / Authenticated
 */
exports.ingestAqiTelemetry = asyncHandler(async (req, res) => {
  const {
    siteId = "SITE-HW-02",
    pm10 = 175,
    pm25 = 82,
    exceedanceDurationMinutes = 65,
  } = req.body;

  const result = await processAqiTelemetry({
    siteId,
    pm10: Number(pm10),
    pm25: Number(pm25),
    exceedanceDurationMinutes: Number(exceedanceDurationMinutes),
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/aqi/verify-barricade
 * @desc    Computer vision verification of 35ft green fabric barricades and wheel-wash basins
 * @access  Public / Authenticated
 */
exports.verifyBarricades = asyncHandler(async (req, res) => {
  const {
    has35FtBarricade = true,
    hasWheelWashBasin = true,
    hasAntiSmogGun = true,
  } = req.body;

  const audit = verifySiteBarricadeProof({
    has35FtBarricade: Boolean(has35FtBarricade),
    hasWheelWashBasin: Boolean(hasWheelWashBasin),
    hasAntiSmogGun: Boolean(hasAntiSmogGun),
  });

  res.status(200).json({
    success: true,
    audit,
  });
});
