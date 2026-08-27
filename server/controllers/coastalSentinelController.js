"use strict";

const asyncHandler = require("express-async-handler");
const MangroveZone = require("../models/MangroveZone");
const { processCoastalScanTelemetry } = require("../services/coastalSentinelService");
const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   GET /api/coastal/zones
 * @desc    Get all protected CRZ-I mangrove belts and satellite NDVI scan data
 * @access  Public / Authenticated
 */
exports.getMangroveZones = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  const zones = await MangroveZone.find(filter).sort({ vegetationLossPercentage: -1 }).lean();

  res.status(200).json({
    success: true,
    count: zones.length,
    zones,
  });
});

/**
 * @route   POST /api/coastal/zones
 * @desc    Register a new CRZ-I Mangrove Zone in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createMangroveZone = asyncHandler(async (req, res) => {
  const {
    zoneId = `CRZ-${Date.now().toString().slice(-5)}`,
    zoneName,
    ward,
    crzClassification = "CRZ_I_ECOLOGICALLY_SENSITIVE",
    totalAreaHectares = 45,
    baselineNdvi = 0.78,
    currentNdvi = 0.72,
    debrisDumpingDetected = false,
    coordinates,
  } = req.body;

  if (!zoneName || typeof zoneName !== "string" || !zoneName.trim()) {
    return res.status(400).json({ success: false, message: "Valid zoneName string is required" });
  }

  if (!ward || typeof ward !== "string" || !ward.trim()) {
    return res.status(400).json({ success: false, message: "Valid ward string is required" });
  }

  if (coordinates && (!Array.isArray(coordinates) || coordinates.length !== 2 || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number")) {
    return res.status(400).json({ success: false, message: "Coordinates must be an array of two numbers [lng, lat]" });
  }

  try {
    const coords = Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [72.8250, 19.1450];
    const bNdvi = Number(baselineNdvi) || 0.78;
    const cNdvi = Number(currentNdvi) || 0.72;
    const lossPct = parseFloat((((bNdvi - cNdvi) / bNdvi) * 100).toFixed(1));
    const status = lossPct >= 25 ? "IMMEDIATE_INJUNCTION_ACTIVE" : lossPct >= 10 ? "ELEVATED_SURVEILLANCE" : "HEALTHY_PROTECTED";

    const zone = await MangroveZone.create({
      zoneId: String(zoneId).trim(),
      zoneName: zoneName.trim(),
      ward: ward.trim(),
      crzClassification,
      totalAreaHectares: Math.max(1, Number(totalAreaHectares) || 10),
      baselineNdvi: bNdvi,
      currentNdvi: cNdvi,
      vegetationLossPercentage: Math.max(0, lossPct),
      debrisDumpingDetected: Boolean(debrisDumpingDetected),
      status,
      lastSatelliteScanAt: new Date(),
      location: {
        type: "Point",
        coordinates: coords,
      },
    });

    invalidateCache(["coastal:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `Mangrove Zone "${zone.zoneName}" registered successfully`,
      zone,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to create mangrove zone" });
  }
});

/**
 * @route   POST /api/coastal/scan-telemetry
 * @desc    Ingest satellite/drone NDVI raster scan telemetry, trigger stop-work injunction if >25% loss
 * @access  Public / Authenticated
 */
exports.ingestCoastalScan = asyncHandler(async (req, res) => {
  const {
    zoneId = "CRZ-KW-01",
    baselineNdvi = 0.78,
    currentNdvi = 0.51,
    debrisDumpingDetected = true,
  } = req.body;

  const result = await processCoastalScanTelemetry({
    zoneId,
    baselineNdvi: Number(baselineNdvi),
    currentNdvi: Number(currentNdvi),
    debrisDumpingDetected: Boolean(debrisDumpingDetected),
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/coastal/issue-injunction
 * @desc    Issue executive cease-and-desist injunction to State Mangrove Cell
 * @access  Protected (Admin / Officer)
 */
exports.issueMangroveInjunction = asyncHandler(async (req, res) => {
  const { zoneId = "CRZ-KW-01" } = req.body;
  const zone = await MangroveZone.findOne({ zoneId }).lean() || { zoneName: "Versova Creek Belt", ward: "Ward K-West" };

  res.status(200).json({
    success: true,
    injunctionId: `EXEC-INJ-${zoneId}-${Date.now().toString().slice(-4)}`,
    zoneName: zone.zoneName,
    ward: zone.ward,
    authority: "Maharashtra State Mangrove Cell & Coastal Police",
    status: "ENFORCED",
    message: `🚨 EXECUTIVE INJUNCTION ISSUED: Environmental protection squad deployed to ${zone.zoneName}.`,
  });
});
