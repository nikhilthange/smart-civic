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
  let buildings = await DilapidatedBuilding.find(filter).sort({ tiltAngleDegrees: -1 });

  if (buildings.length === 0) {
    buildings = DEFAULT_BUILDINGS.filter((b) => !ward || ward === "all" || b.ward === ward);
  }

  res.status(200).json({
    success: true,
    count: buildings.length,
    buildings,
  });
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
