"use strict";

const asyncHandler = require("express-async-handler");
const TransitLaneObstruction = require("../models/TransitLaneObstruction");
const { generateTransitLaneChallan } = require("../services/transitLaneService");
const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   GET /api/transit-lane/obstructions
 * @desc    Get all active BEST bus lane obstructions & ANPR traffic challans
 * @access  Public / Authenticated
 */
exports.getTransitObstructions = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  const obstructions = await TransitLaneObstruction.find(filter).sort({ createdAt: -1 }).lean();

  res.status(200).json({
    success: true,
    count: obstructions.length,
    obstructions,
  });
});

/**
 * @route   POST /api/transit-lane/obstructions
 * @desc    Log a new transit lane obstruction event directly in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createTransitObstruction = asyncHandler(async (req, res) => {
  const {
    bestBusVehicleId = "BEST-EV-902",
    routeCorridorName = "BKC BRTS Dedicated Transit Corridor",
    ward,
    vehiclePlateNo,
    vehicleType = "PRIVATE_CAR",
    transitDelaySeconds = 160,
    coordinates,
  } = req.body;

  if (!ward || typeof ward !== "string" || !ward.trim()) {
    return res.status(400).json({ success: false, message: "Valid ward string is required" });
  }

  if (!vehiclePlateNo || typeof vehiclePlateNo !== "string" || !vehiclePlateNo.trim()) {
    return res.status(400).json({ success: false, message: "Valid vehiclePlateNo is required" });
  }

  if (coordinates && (!Array.isArray(coordinates) || coordinates.length !== 2 || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number")) {
    return res.status(400).json({ success: false, message: "Coordinates must be an array of two numbers [lng, lat]" });
  }

  try {
    const coords = Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [72.8680, 19.0650];
    const challan = generateTransitLaneChallan({
      bestBusVehicleId: String(bestBusVehicleId).trim(),
      routeCorridorName: String(routeCorridorName).trim(),
      ward: ward.trim(),
      vehiclePlateNo: vehiclePlateNo.trim().toUpperCase(),
      vehicleType,
      transitDelaySeconds: Math.max(0, Number(transitDelaySeconds) || 0),
    });

    const obstruction = await TransitLaneObstruction.create({
      ...challan,
      location: {
        type: "Point",
        coordinates: coords,
      },
    });

    invalidateCache(["transit-lane:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `Transit obstruction challan generated for ${obstruction.vehiclePlateNo}`,
      obstruction,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to create transit obstruction" });
  }
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
