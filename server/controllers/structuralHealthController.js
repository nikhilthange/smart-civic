"use strict";

const asyncHandler = require("express-async-handler");
const DilapidatedBuilding = require("../models/DilapidatedBuilding");
const {
  DEFAULT_BUILDINGS,
  processStructuralTelemetry,
} = require("../services/structuralHealthService");

/**
 * @route   GET /api/structural/buildings
 * @desc    Get all C1 / C2A dilapidated buildings and micro-sensor tilt telemetry
 * @access  Public / Authenticated
 */
exports.getDilapidatedBuildings = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  const buildings = await DilapidatedBuilding.find(filter).sort({ tiltAngleDegrees: -1 }).lean();

  res.status(200).json({
    success: true,
    count: buildings.length,
    buildings,
  });
});

const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   POST /api/structural/buildings
 * @desc    Register new dilapidated building structure directly in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createDilapidatedBuilding = asyncHandler(async (req, res) => {
  const {
    buildingId = `BLD-${Date.now().toString().slice(-5)}`,
    buildingName,
    ward,
    address,
    structuralCategory = "C1_DEMOLISH_IMMEDIATE",
    occupancyStatus = "OCCUPIED",
    residentFamilyCount = 24,
    tiltAngleDegrees = 1.2,
    crackDisplacementMm = 6.5,
    coordinates,
  } = req.body;

  if (!buildingName || typeof buildingName !== "string" || !buildingName.trim()) {
    return res.status(400).json({ success: false, message: "Valid buildingName string is required" });
  }

  if (!ward || typeof ward !== "string" || !ward.trim()) {
    return res.status(400).json({ success: false, message: "Valid ward string is required" });
  }

  if (coordinates && (!Array.isArray(coordinates) || coordinates.length !== 2 || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number")) {
    return res.status(400).json({ success: false, message: "Coordinates must be an array of two numbers [lng, lat]" });
  }

  try {
    const coords = Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [72.8410, 19.0050];
    const tilt = Number(tiltAngleDegrees) || 0;
    const status = tilt >= 2.5 ? "IMMINENT_COLLAPSE_HAZARD" : tilt >= 1.5 ? "ELEVATED_VIBRATION" : "STABLE_MONITORED";

    const building = await DilapidatedBuilding.create({
      buildingId: String(buildingId).trim(),
      buildingName: buildingName.trim(),
      ward: ward.trim(),
      address: address ? String(address).trim() : "Ward Structural Zone",
      structuralCategory,
      occupancyStatus,
      residentFamilyCount: Math.max(1, Number(residentFamilyCount) || 1),
      tiltAngleDegrees: Math.max(0, tilt),
      crackDisplacementMm: Math.max(0, Number(crackDisplacementMm) || 0),
      status,
      location: {
        type: "Point",
        coordinates: coords,
      },
    });

    invalidateCache(["structural:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `Building "${building.buildingName}" registered successfully`,
      building,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to register building" });
  }
});

/**
 * @route   POST /api/structural/telemetry
 * @desc    Ingest real-time tiltmeter & crack displacement sensor stream, trigger transit camp allocation
 * @access  Public / Authenticated
 */
exports.ingestStructuralTelemetry = asyncHandler(async (req, res) => {
  const {
    buildingId = "BLD-GN-01",
    tiltAngleDegrees = 2.8,
    crackDisplacementMm = 14.5,
    vibrationIndexHz = 5.4,
  } = req.body;

  const result = await processStructuralTelemetry({
    buildingId,
    tiltAngleDegrees: Number(tiltAngleDegrees),
    crackDisplacementMm: Number(crackDisplacementMm),
    vibrationIndexHz: Number(vibrationIndexHz),
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/structural/evacuation-order
 * @desc    Issue manual executive evacuation order & generate transit camp QR passes
 * @access  Protected (Admin / Officer)
 */
exports.issueEvacuationOrder = asyncHandler(async (req, res) => {
  const { buildingId = "BLD-GN-01", transitCampLocation = "Sion-Koliwada Transit Sector C" } = req.body;

  const building = DEFAULT_BUILDINGS.find((b) => b.buildingId === buildingId) || DEFAULT_BUILDINGS[0];

  res.status(200).json({
    success: true,
    orderId: `EVAC-EXEC-${buildingId}-${Date.now().toString().slice(-4)}`,
    buildingName: building.buildingName,
    ward: building.ward,
    transitCampAllocated: true,
    transitCampLocation,
    affectedFamilies: building.residentFamilyCount,
    message: `🚨 EXECUTIVE EVACUATION ENFORCED: ${building.residentFamilyCount} families routed to ${transitCampLocation}.`,
  });
});
