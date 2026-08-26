"use strict";

const asyncHandler = require("express-async-handler");
const WaterFlowZone = require("../models/WaterFlowZone");
const WaterTanker = require("../models/WaterTanker");
const {
  calculateWaterLossDiscrepancy,
  generateTankerQrPass,
  verifyTankerDelivery,
} = require("../services/waterAuditService");

const DEFAULT_WATER_ZONES = [
  {
    zoneId: "DMA-GN-01",
    zoneName: "Dadar-Prabhadevi High Pressure Distribution Zone",
    ward: "Ward G-North",
    masterReservoirInflowMld: 48.0,
    aggregateDmaOutflowMld: 36.8,
    lossPercentage: 23.3,
    status: "CRITICAL_PIPELINE_THEFT_LEAK",
    pipelinePressurePsi: 38.5,
    location: {
      type: "Point",
      coordinates: [72.8425, 19.0185],
    },
  },
  {
    zoneId: "DMA-HW-02",
    zoneName: "Bandra West Pali Hill Sector",
    ward: "Ward H-West",
    masterReservoirInflowMld: 32.0,
    aggregateDmaOutflowMld: 29.4,
    lossPercentage: 8.1,
    status: "NORMAL",
    pipelinePressurePsi: 44.0,
    location: {
      type: "Point",
      coordinates: [72.8310, 19.0620],
    },
  },
  {
    zoneId: "DMA-KW-03",
    zoneName: "Andheri Lokhandwala Commercial Grid",
    ward: "Ward K-West",
    masterReservoirInflowMld: 54.0,
    aggregateDmaOutflowMld: 46.2,
    lossPercentage: 14.4,
    status: "MODERATE_LOSS",
    pipelinePressurePsi: 41.2,
    location: {
      type: "Point",
      coordinates: [72.8270, 19.1350],
    },
  },
];

/**
 * @route   GET /api/water/audit-zones
 * @desc    Get all District Metered Areas (DMA) and Non-Revenue Water differential loss metrics
 * @access  Public / Authenticated
 */
exports.getWaterAuditZones = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  let zones = await WaterFlowZone.find(filter).sort({ lossPercentage: -1 });

  if (zones.length === 0) {
    zones = DEFAULT_WATER_ZONES.filter((z) => !ward || ward === "all" || z.ward === ward);
  }

  res.status(200).json({
    success: true,
    count: zones.length,
    zones,
  });
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
