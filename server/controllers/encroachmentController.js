"use strict";

const asyncHandler = require("express-async-handler");
const HawkingZone = require("../models/HawkingZone");
const {
  DEFAULT_NO_HAWKING_ZONES,
  checkNonHawkingZoneViolation,
} = require("../services/encroachmentService");

/**
 * @route   GET /api/encroachment/zones
 * @desc    Get all statutory No-Hawking and Designated Hawking zones
 * @access  Public / Authenticated
 */
exports.getHawkingZones = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  const dbZones = await HawkingZone.find(filter);

  const zones = dbZones.length > 0 ? dbZones : DEFAULT_NO_HAWKING_ZONES;

  res.status(200).json({
    success: true,
    count: zones.length,
    zones,
  });
});

/**
 * @route   POST /api/encroachment/check-zone
 * @desc    Tests coordinates for unauthorized stall proximity to 150m No-Hawking buffer
 * @access  Public / Authenticated
 */
exports.auditHawkingEncroachment = asyncHandler(async (req, res) => {
  const { coordinates, ward } = req.body;

  if (!coordinates || !Array.isArray(coordinates)) {
    res.status(400);
    throw new Error("Coordinates array [longitude, latitude] required");
  }

  const result = await checkNonHawkingZoneViolation(coordinates, ward);

  res.status(200).json({
    success: true,
    ...result,
  });
});
