"use strict";

const asyncHandler = require("express-async-handler");
const HawkingZone = require("../models/HawkingZone");
const { checkNonHawkingZoneViolation } = require("../services/encroachmentService");
const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   GET /api/encroachment/zones
 * @desc    Get all statutory No-Hawking and Designated Hawking zones
 * @access  Public / Authenticated
 */
exports.getHawkingZones = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  const zones = await HawkingZone.find(filter).lean();

  res.status(200).json({
    success: true,
    count: zones.length,
    zones,
  });
});

/**
 * @route   POST /api/encroachment/zones
 * @desc    Register a new Hawking / No-Hawking zone in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createHawkingZone = asyncHandler(async (req, res) => {
  const {
    zoneId = `HWK-${Date.now().toString().slice(-5)}`,
    zoneName,
    ward,
    zoneType = "NON_HAWKING_ZONE",
    restrictionReason = "150-Meter Statutory Buffer from Suburban Railway Station",
    authorizedStallCapacity = 0,
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
    const coords = Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [72.8425, 19.0185];

    const zone = await HawkingZone.create({
      zoneId: String(zoneId).trim(),
      zoneName: zoneName.trim(),
      ward: ward.trim(),
      zoneType,
      restrictionReason: String(restrictionReason).trim(),
      authorizedStallCapacity: Math.max(0, Number(authorizedStallCapacity) || 0),
      geometry: {
        type: "Point",
        coordinates: coords,
      },
    });

    invalidateCache(["encroachment:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `Hawking Zone "${zone.zoneName}" registered successfully`,
      zone,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to create hawking zone" });
  }
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
