"use strict";

const asyncHandler = require("express-async-handler");
const HighRiseFireNoc = require("../models/HighRiseFireNoc");
const {
  DEFAULT_FIRE_BUILDINGS,
  processFireRiserTelemetry,
} = require("../services/fireSafetyService");

/**
 * @route   GET /api/fire-safety/buildings
 * @desc    Get all high-rise buildings, fire NOC statuses, and wet-riser booster pressures
 * @access  Public / Authenticated
 */
exports.getFireSafetyBuildings = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  let buildings = await HighRiseFireNoc.find(filter).sort({ floorCount: -1 });

  if (buildings.length === 0) {
    buildings = DEFAULT_FIRE_BUILDINGS.filter((b) => !ward || ward === "all" || b.ward === ward);
  }

  res.status(200).json({
    success: true,
    count: buildings.length,
    buildings,
  });
});

/**
 * @route   POST /api/fire-safety/telemetry
 * @desc    Ingests booster pump pressure telemetry, auto-flags MFB radar & Property Tax citation
 * @access  Public / Authenticated
 */
exports.ingestFireTelemetry = asyncHandler(async (req, res) => {
  const {
    buildingId = "FIRE-HW-01",
    wetRiserPressureKgCm2 = 2.1,
    pressureLossDurationMinutes = 45,
  } = req.body;

  const result = await processFireRiserTelemetry({
    buildingId,
    wetRiserPressureKgCm2: Number(wetRiserPressureKgCm2),
    pressureLossDurationMinutes: Number(pressureLossDurationMinutes),
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/fire-safety/audit-refuge
 * @desc    Report refuge floor encroachment / blocked fire escape stairwell
 * @access  Protected (Admin / Fire Inspector)
 */
exports.auditRefugeArea = asyncHandler(async (req, res) => {
  const { buildingId = "FIRE-KW-03", refugeFloorEncroached = true } = req.body;
  const building = DEFAULT_FIRE_BUILDINGS.find((b) => b.buildingId === buildingId) || DEFAULT_FIRE_BUILDINGS[0];

  res.status(200).json({
    success: true,
    citationId: `REFUGE-CIT-${buildingId}-${Date.now().toString().slice(-4)}`,
    buildingName: building.buildingName,
    ward: building.ward,
    sacId: building.propertyTaxSacId,
    penaltyInr: 50000,
    status: "REFUGE_BLOCKED_VIOLATION",
    message: `🚨 REFUGE FLOOR BLOCKED: Notice issued to ${building.buildingName}. ₹50,000 penalty debited against Property Tax SAC (${building.propertyTaxSacId}).`,
  });
});
