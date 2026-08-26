"use strict";

const asyncHandler = require("express-async-handler");
const TransitLaneObstruction = require("../models/TransitLaneObstruction");
const {
  DEFAULT_OBSTRUCTIONS,
  generateTransitLaneChallan,
} = require("../services/transitLaneService");

/**
 * @route   GET /api/transit-lane/obstructions
 * @desc    Get all active BEST bus lane obstructions & ANPR traffic challans
 * @access  Public / Authenticated
 */
exports.getTransitObstructions = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  let obstructions = await TransitLaneObstruction.find(filter).sort({ createdAt: -1 });

  if (obstructions.length === 0) {
    obstructions = DEFAULT_OBSTRUCTIONS.filter((o) => !ward || ward === "all" || o.ward === ward);
  }

  res.status(200).json({
    success: true,
    count: obstructions.length,
    obstructions,
  });
});

/**
 * @route   POST /api/transit-lane/dashcam-event
 * @desc    Ingests frontline bus camera ANPR detection, generates e-challan & dispatches towing
 * @access  Public / Authenticated
 */
exports.ingestDashcamViolation = asyncHandler(async (req, res) => {
  const {
    bestBusVehicleId = "BEST-EV-902",
    routeCorridorName = "BKC BRTS Dedicated Transit Corridor",
    ward = "Ward H-East",
    vehiclePlateNo = "MH-02-EQ-8819",
    vehicleType = "PRIVATE_CAR",
    transitDelaySeconds = 160,
  } = req.body;

  const challan = generateTransitLaneChallan({
    bestBusVehicleId,
    routeCorridorName,
    ward,
    vehiclePlateNo,
    vehicleType,
    transitDelaySeconds: Number(transitDelaySeconds),
  });

  try {
    await TransitLaneObstruction.create({
      ...challan,
      location: {
        type: "Point",
        coordinates: [72.8680, 19.0650],
      },
    });
  } catch {
    // continue
  }

  res.status(200).json({
    success: true,
    challan,
  });
});
