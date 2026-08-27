"use strict";

const asyncHandler = require("express-async-handler");
const SubwayStatus = require("../models/SubwayStatus");
const {
  DEFAULT_SUBWAYS,
  evaluateSubwayInundation,
} = require("../services/evacuationRoutingService");

/**
 * @route   GET /api/disaster/subways
 * @desc    Get all major Mumbai underpasses and live flood depth sensor levels
 * @access  Public / Authenticated
 */
exports.getSubways = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  const subways = await SubwayStatus.find(filter).sort({ waterDepthCm: -1 }).lean();

  res.status(200).json({
    success: true,
    count: subways.length,
    subways,
  });
});

const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   POST /api/disaster/subways
 * @desc    Create/register new subway underpass in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createSubway = asyncHandler(async (req, res) => {
  const {
    subwayId = `SUB-${Date.now().toString().slice(-4)}`,
    subwayName,
    ward,
    waterDepthCm = 10,
    criticalThresholdCm = 30,
    safeDetourCorridor = "Elevated Flyover Bypass",
    alternateFlyoverName = "Main Flyover",
    activePumpsCount = 4,
    coordinates,
  } = req.body;

  if (!subwayName || typeof subwayName !== "string" || !subwayName.trim()) {
    return res.status(400).json({ success: false, message: "Valid subwayName string is required" });
  }

  if (!ward || typeof ward !== "string" || !ward.trim()) {
    return res.status(400).json({ success: false, message: "Valid ward string is required" });
  }

  if (coordinates && (!Array.isArray(coordinates) || coordinates.length !== 2 || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number")) {
    return res.status(400).json({ success: false, message: "Coordinates must be an array of two numbers [lng, lat]" });
  }

  const depth = Number(waterDepthCm);
  if (isNaN(depth) || depth < 0) {
    return res.status(400).json({ success: false, message: "waterDepthCm must be a non-negative number" });
  }

  try {
    const coords = Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [72.8467, 19.1197];
    const thresh = Math.max(10, Number(criticalThresholdCm) || 30);
    const trafficStatus = depth >= thresh ? "SUBMERGED_CLOSED" : depth >= (thresh * 0.7) ? "RESTRICTED_SINGLE_LANE" : "OPEN";

    const subway = await SubwayStatus.create({
      subwayId: String(subwayId).trim(),
      subwayName: subwayName.trim(),
      ward: ward.trim(),
      waterDepthCm: depth,
      criticalThresholdCm: thresh,
      trafficStatus,
      safeDetourCorridor: safeDetourCorridor ? String(safeDetourCorridor).trim() : "Main Road Detour",
      alternateFlyoverName: alternateFlyoverName ? String(alternateFlyoverName).trim() : "Main Flyover",
      activePumpsCount: Math.max(0, Number(activePumpsCount) || 0),
      location: {
        type: "Point",
        coordinates: coords,
      },
    });

    invalidateCache(["subway:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `Subway "${subway.subwayName}" created successfully`,
      subway,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to create subway" });
  }
});

/**
 * @route   POST /api/disaster/telemetry
 * @desc    Ingests real-time ultrasonic water depth telemetry, auto-diverts traffic if >= 30cm
 * @access  Public / Authenticated
 */
exports.ingestSubwayTelemetry = asyncHandler(async (req, res) => {
  const { subwayId = "SUB-ANDHERI", waterDepthCm = 35 } = req.body;

  const result = evaluateSubwayInundation(subwayId, Number(waterDepthCm));

  res.status(200).json({
    success: true,
    ...result,
  });
});
