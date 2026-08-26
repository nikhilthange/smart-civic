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
  let subways = await SubwayStatus.find(filter).sort({ waterDepthCm: -1 });

  if (subways.length === 0) {
    subways = DEFAULT_SUBWAYS.filter((s) => !ward || ward === "all" || s.ward === ward);
  }

  res.status(200).json({
    success: true,
    count: subways.length,
    subways,
  });
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
