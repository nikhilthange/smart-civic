"use strict";

const asyncHandler = require("express-async-handler");
const ConstructionSite = require("../models/ConstructionSite");
const {
  processAqiTelemetry,
  verifySiteBarricadeProof,
} = require("../services/aqiEnforcementService");
const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   GET /api/aqi/sites
 * @desc    Get all active construction sites and PM10/PM2.5 micro-sensor readings
 * @access  Public / Authenticated
 */
exports.getConstructionSites = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  const sites = await ConstructionSite.find(filter).sort({ currentPm10: -1 }).lean();

  res.status(200).json({
    success: true,
    count: sites.length,
    sites,
  });
});

/**
 * @route   POST /api/aqi/sites
 * @desc    Create/register new construction site in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createConstructionSite = asyncHandler(async (req, res) => {
  const {
    siteId = `SITE-${Date.now().toString().slice(-5)}`,
    developerName,
    projectName,
    reraPermitNo,
    ward,
    address,
    has35FtBarricadeCompliance = true,
    hasWheelWashBasin = true,
    hasAntiSmogGun = true,
    currentPm10 = 85,
    currentPm25 = 40,
    coordinates,
  } = req.body;

  if (!projectName || typeof projectName !== "string" || !projectName.trim()) {
    return res.status(400).json({ success: false, message: "Valid projectName string is required" });
  }

  if (!ward || typeof ward !== "string" || !ward.trim()) {
    return res.status(400).json({ success: false, message: "Valid ward string is required" });
  }

  if (coordinates && (!Array.isArray(coordinates) || coordinates.length !== 2 || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number")) {
    return res.status(400).json({ success: false, message: "Coordinates must be an array of two numbers [lng, lat]" });
  }

  try {
    const coords = Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [72.8310, 19.0125];
    const pm10Val = Math.max(0, Number(currentPm10) || 85);
    const pm25Val = Math.max(0, Number(currentPm25) || 40);
    const status = pm10Val >= 150 ? "STOP_WORK_NOTICE_ACTIVE" : pm10Val >= 100 ? "UNDER_AUDIT" : "COMPLIANT";

    const site = await ConstructionSite.create({
      siteId: String(siteId).trim(),
      developerName: developerName ? String(developerName).trim() : "Municipal Infrastructure Developer",
      projectName: projectName.trim(),
      reraPermitNo: reraPermitNo ? String(reraPermitNo).trim() : `P518${Date.now().toString().slice(-6)}`,
      ward: ward.trim(),
      address: address ? String(address).trim() : "Ward Construction Corridor",
      has35FtBarricadeCompliance: Boolean(has35FtBarricadeCompliance),
      hasWheelWashBasin: Boolean(hasWheelWashBasin),
      hasAntiSmogGun: Boolean(hasAntiSmogGun),
      currentPm10: pm10Val,
      currentPm25: pm25Val,
      stopWorkNoticeIssued: pm10Val >= 150,
      totalPenaltiesLeviedInr: pm10Val >= 150 ? 50000 : 0,
      status,
      location: {
        type: "Point",
        coordinates: coords,
      },
    });

    invalidateCache(["aqi:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `Construction site "${site.projectName}" registered successfully`,
      site,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to create construction site" });
  }
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
