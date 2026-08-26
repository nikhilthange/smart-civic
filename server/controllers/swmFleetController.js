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
