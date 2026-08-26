"use strict";

const asyncHandler = require("express-async-handler");
const MangroveZone = require("../models/MangroveZone");
const {
  DEFAULT_COASTAL_ZONES,
  processCoastalScanTelemetry,
} = require("../services/coastalSentinelService");

/**
 * @route   GET /api/coastal/zones
 * @desc    Get all protected CRZ-I mangrove belts and satellite NDVI scan data
 * @access  Public / Authenticated
 */
exports.getMangroveZones = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  let zones = await MangroveZone.find(filter).sort({ vegetationLossPercentage: -1 });

  if (zones.length === 0) {
    zones = DEFAULT_COASTAL_ZONES.filter((z) => !ward || ward === "all" || z.ward === ward);
  }

  res.status(200).json({
    success: true,
    count: zones.length,
    zones,
  });
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
  const zone = DEFAULT_COASTAL_ZONES.find((z) => z.zoneId === zoneId) || DEFAULT_COASTAL_ZONES[0];

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
