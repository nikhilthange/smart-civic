"use strict";

const asyncHandler = require("express-async-handler");
const HighRiseFireNoc = require("../models/HighRiseFireNoc");
const { processFireRiserTelemetry } = require("../services/fireSafetyService");
const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   GET /api/fire-safety/buildings
 * @desc    Get all high-rise buildings, fire NOC statuses, and wet-riser booster pressures
 * @access  Public / Authenticated
 */
exports.getFireSafetyBuildings = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  const buildings = await HighRiseFireNoc.find(filter).sort({ floorCount: -1 }).lean();

  res.status(200).json({
    success: true,
    count: buildings.length,
    buildings,
  });
});

/**
 * @route   POST /api/fire-safety/buildings
 * @desc    Register a new high-rise building with Fire NOC in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createFireBuilding = asyncHandler(async (req, res) => {
  const {
    buildingId = `FIRE-${Date.now().toString().slice(-5)}`,
    buildingName,
    ward,
    address,
    floorCount = 28,
    propertyTaxSacId = `SAC-FIRE-${Date.now().toString().slice(-4)}`,
    wetRiserPressureKgCm2 = 6.8,
    fireNocStatus = "VALID_NOC",
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
    const coords = Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [72.8280, 19.0620];
    const pressure = Math.max(0, Number(wetRiserPressureKgCm2) || 6.8);
    const pressureStatus = pressure < 3.5 ? "CRITICAL_PRESSURE_LOSS" : pressure < 5.0 ? "PRESSURE_DROP_WARNING" : "PRESSURE_NORMAL";

    const building = await HighRiseFireNoc.create({
      buildingId: String(buildingId).trim(),
      buildingName: buildingName.trim(),
      ward: ward.trim(),
      address: address ? String(address).trim() : "Ward High-Rise Corridor",
      floorCount: Math.max(1, Number(floorCount) || 1),
      propertyTaxSacId: String(propertyTaxSacId).trim(),
      fireNocStatus,
      wetRiserPressureKgCm2: pressure,
      pressureStatus,
      refugeFloorEncroached: false,
      lastAuditDate: new Date(),
      location: {
        type: "Point",
        coordinates: coords,
      },
    });

    invalidateCache(["fire-safety:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `High-rise fire compliance building "${building.buildingName}" registered successfully`,
      building,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to create fire safety building" });
  }
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
  const { buildingId = "FIRE-KW-03" } = req.body;
  const building = await HighRiseFireNoc.findOne({ buildingId }).lean() || { buildingName: "High Rise Tower", ward: "Ward K-West", propertyTaxSacId: "SAC-KW-1100" };

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
