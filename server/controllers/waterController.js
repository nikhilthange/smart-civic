"use strict";

const asyncHandler = require("express-async-handler");
const WaterFlowZone = require("../models/WaterFlowZone");
const WaterTanker = require("../models/WaterTanker");
const {
  calculateWaterLossDiscrepancy,
  generateTankerQrPass,
  verifyTankerDelivery,
} = require("../services/waterAuditService");
const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   GET /api/water/audit-zones
 * @desc    Get all District Metered Areas (DMA) and Non-Revenue Water differential loss metrics
 * @access  Public / Authenticated
 */
exports.getWaterAuditZones = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  const zones = await WaterFlowZone.find(filter).sort({ lossPercentage: -1 }).lean();

  res.status(200).json({
    success: true,
    count: zones.length,
    zones,
  });
});

/**
 * @route   POST /api/water/audit-zones
 * @desc    Register a new District Metered Area (DMA) in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createWaterZone = asyncHandler(async (req, res) => {
  const {
    zoneId = `DMA-${Date.now().toString().slice(-5)}`,
    zoneName,
    ward,
    masterReservoirInflowMld = 40.0,
    aggregateDmaOutflowMld = 32.0,
    pipelinePressurePsi = 42.0,
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
    const inflow = Math.max(1, Number(masterReservoirInflowMld) || 40);
    const outflow = Math.max(0, Number(aggregateDmaOutflowMld) || 32);
    const lossPct = parseFloat((((inflow - outflow) / inflow) * 100).toFixed(1));
    const status = lossPct >= 20 ? "CRITICAL_PIPELINE_THEFT_LEAK" : lossPct >= 10 ? "MODERATE_LOSS" : "NORMAL";

    const zone = await WaterFlowZone.create({
      zoneId: String(zoneId).trim(),
      zoneName: zoneName.trim(),
      ward: ward.trim(),
      masterReservoirInflowMld: inflow,
      aggregateDmaOutflowMld: outflow,
      lossPercentage: Math.max(0, lossPct),
      status,
      pipelinePressurePsi: Number(pipelinePressurePsi) || 42.0,
      location: {
        type: "Point",
        coordinates: coords,
      },
    });

    invalidateCache(["water:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `DMA Water Zone "${zone.zoneName}" registered successfully`,
      zone,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to create water zone" });
  }
});

/**
 * @route   POST /api/water/tanker-pass
 * @desc    Generate dynamic cryptographically signed QR trip pass for water tanker
 * @access  Public / Authenticated
 */
exports.createTankerTripPass = asyncHandler(async (req, res) => {
  const {
    tankerRegistrationNo = "MH-01-AN-9921",
    driverName = "Suresh Patil",
    driverMobile = "9820199182",
    capacityLiters = 10000,
    destinationSociety = "Raheja Horizon CHS, Bandra West",
    destinationWard = "Ward H-West",
    maxCappedRateInr = 1800,
  } = req.body;

  const pass = generateTankerQrPass({
    tankerRegistrationNo,
    driverName,
    driverMobile,
    capacityLiters: Number(capacityLiters),
    destinationSociety,
    destinationWard,
    maxCappedRateInr: Number(maxCappedRateInr),
  });

  try {
    await WaterTanker.create(pass);
  } catch {
    // continue
  }

  res.status(200).json({
    success: true,
    pass,
  });
});

/**
 * @route   POST /api/water/verify-tanker-qr
 * @desc    Verify tanker QR manifest at destination and audit black-market price caps
 * @access  Public / Authenticated
 */
exports.verifyTankerQr = asyncHandler(async (req, res) => {
  const {
    tripPassId,
    qrSignatureHash,
    reportedPriceChargedInr = 1800,
    maxCappedRateInr = 1800,
  } = req.body;

  const verification = verifyTankerDelivery({
    tripPassId,
    qrSignatureHash,
    reportedPriceChargedInr: Number(reportedPriceChargedInr),
    maxCappedRateInr: Number(maxCappedRateInr),
  });

  res.status(200).json({
    success: true,
    ...verification,
  });
});
