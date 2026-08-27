"use strict";

const asyncHandler = require("express-async-handler");
const BinTelemetry = require("../models/BinTelemetry");
const {
  WARD_ROUTES,
  checkCompactorRouteDeviation,
  processRfidLift,
} = require("../services/swmFleetService");

/**
 * @route   GET /api/swm/bins
 * @desc    Get all RFID smart bins across wards
 * @access  Public / Authenticated
 */
exports.getSmartBins = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  const bins = await BinTelemetry.find(filter).sort({ currentFillPercentage: -1 });

  res.status(200).json({
    success: true,
    count: bins.length,
    bins,
  });
});

/**
 * @route   POST /api/swm/rfid-lift
 * @desc    Log hydraulic compactor RFID lift event and reset bin fill SLA
 * @access  Public / Authenticated
 */
exports.logRfidLift = asyncHandler(async (req, res) => {
  const { rfidTag, truckId, grossWeightKg } = req.body;

  if (!rfidTag) {
    res.status(400);
    throw new Error("RFID Tag UID is required");
  }

  const result = await processRfidLift({
    rfidTag,
    truckId: truckId || "MH-01-CV-4081",
    grossWeightKg: Number(grossWeightKg || 380),
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/swm/check-route-deviation
 * @desc    Evaluate GPS breadcrumb stream against planned collection corridor
 * @access  Public / Authenticated
 */
exports.auditRouteCompliance = asyncHandler(async (req, res) => {
  const { truckId = "MH-01-CV-4081", ward = "Ward G-North", breadcrumbs = [] } = req.body;

  // Fallback sample breadcrumbs if none provided
  const sampleCrumbs =
    breadcrumbs.length > 0
      ? breadcrumbs
      : [
          [72.8425, 19.0185], // Plaza Cinema (Visited)
          [72.8385, 19.0270], // Shivaji Park Gate 4 (Visited)
        ];

  const audit = checkCompactorRouteDeviation(truckId, ward, sampleCrumbs);

  res.status(200).json({
    success: true,
    audit,
  });
});

/**
 * @route   GET /api/swm/fleet-status
 * @desc    Get live compactor fleet positions and planned ward corridors
 * @access  Public / Authenticated
 */
exports.getFleetCorridors = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    corridors: WARD_ROUTES,
    activeCompactorsCount: 14,
    totalDailyGarbageLifts: 342,
  });
});

const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   POST /api/swm/bins
 * @desc    Create a new Smart RFID Bin in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createSmartBin = asyncHandler(async (req, res) => {
  const {
    binId = `BIN-${Date.now().toString().slice(-5)}`,
    rfidTag = `RFID-${Date.now().toString().slice(-6)}`,
    ward,
    locality,
    capacityLiters = 1100,
    currentFillPercentage = 35,
    wasteType = "MIXED_MSW",
    coordinates,
  } = req.body;

  if (!ward || typeof ward !== "string" || !ward.trim()) {
    return res.status(400).json({ success: false, message: "Valid ward string is required" });
  }

  if (coordinates && (!Array.isArray(coordinates) || coordinates.length !== 2 || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number")) {
    return res.status(400).json({ success: false, message: "Coordinates must be an array of two numbers [lng, lat]" });
  }

  const fill = Number(currentFillPercentage);
  if (isNaN(fill) || fill < 0 || fill > 100) {
    return res.status(400).json({ success: false, message: "currentFillPercentage must be a number between 0 and 100" });
  }

  try {
    const coords = Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [72.8290, 19.0540];
    const status = fill >= 90 ? "OVERFLOWING" : fill >= 75 ? "NEAR_FULL" : fill <= 10 ? "CLEANED" : "NORMAL";

    const bin = await BinTelemetry.create({
      binId: String(binId).trim(),
      rfidTag: String(rfidTag).trim(),
      ward: ward.trim(),
      locality: locality ? String(locality).trim() : "Ward SWM Hub",
      capacityLiters: Math.max(100, Number(capacityLiters) || 1100),
      currentFillPercentage: fill,
      status,
      wasteType,
      location: {
        type: "Point",
        coordinates: coords,
      },
    });

    invalidateCache(["swm:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `Smart Bin "${bin.binId}" created successfully`,
      bin,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to create smart bin" });
  }
});
