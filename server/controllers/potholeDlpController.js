"use strict";

const asyncHandler = require("express-async-handler");
const RoadContract = require("../models/RoadContract");
const {
  estimatePotholeVolume,
  checkDlpRoadWarranty,
  freezeContractorRetention,
} = require("../services/potholeVolumeService");

/**
 * @route   GET /api/dlp/contracts
 * @desc    Get all DLP road contracts across wards
 * @access  Public / Authenticated
 */
exports.getRoadContracts = asyncHandler(async (req, res) => {
  const { ward, status } = req.query;
  const filter = {};
  if (ward && ward !== "all") filter.ward = ward;
  if (status && status !== "all") filter.status = status;

  const contracts = await RoadContract.find(filter).sort({ dlpExpiryDate: 1 });

  res.status(200).json({
    success: true,
    count: contracts.length,
    contracts,
  });
});

/**
 * @route   POST /api/dlp/estimate-volume
 * @desc    Calculates 3D asphalt volume, surface area, and cold-mix bag count
 * @access  Public / Authenticated
 */
exports.calculatePotholeVolume = asyncHandler(async (req, res) => {
  const {
    lengthCm = 80,
    widthCm = 60,
    depthCm = 8,
    surfaceType = "MASTIC_ASPHALT",
  } = req.body;

  const estimation = estimatePotholeVolume({
    lengthCm: Number(lengthCm),
    widthCm: Number(widthCm),
    depthCm: Number(depthCm),
    surfaceType,
  });

  res.status(200).json({
    success: true,
    estimation,
  });
});

/**
 * @route   POST /api/dlp/check-warranty
 * @desc    Tests coordinate point for active DLP road contractor liability (50m buffer)
 * @access  Public / Authenticated
 */
exports.checkWarrantyLiability = asyncHandler(async (req, res) => {
  const { coordinates, ward } = req.body;

  if (!coordinates || !Array.isArray(coordinates)) {
    res.status(400);
    throw new Error("Coordinates array [longitude, latitude] required");
  }

  const result = await checkDlpRoadWarranty(coordinates, ward);

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/dlp/freeze-retention/:contractId
 * @desc    Freeze contractor retention deposit due to unaddressed DLP defect
 * @access  Protected (Admin / Officer)
 */
exports.freezeRetentionDeposit = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const { reason } = req.body;

  const result = await freezeContractorRetention(contractId, reason);
  if (!result) {
    res.status(404);
    throw new Error("Road contract not found");
  }

  res.status(200).json({
    success: true,
    message: `Contractor retention deposit of ₹${result.retentionFundAmountInr.toLocaleString()} frozen successfully`,
    result,
  });
});

const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   POST /api/dlp/contracts
 * @desc    Create a new Road DLP contract directly in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createRoadContract = asyncHandler(async (req, res) => {
  const {
    contractId = `DLP-${Date.now().toString().slice(-6)}`,
    roadName,
    contractorName,
    ward,
    completionDate,
    dlpExpiryDate,
    retentionFundAmountInr = 1500000,
    status = "UNDER_WARRANTY",
    coordinates,
  } = req.body;

  if (!roadName || typeof roadName !== "string" || !roadName.trim()) {
    return res.status(400).json({ success: false, message: "Valid roadName string is required" });
  }

  if (!contractorName || typeof contractorName !== "string" || !contractorName.trim()) {
    return res.status(400).json({ success: false, message: "Valid contractorName string is required" });
  }

  if (!ward || typeof ward !== "string" || !ward.trim()) {
    return res.status(400).json({ success: false, message: "Valid ward string is required" });
  }

  if (coordinates && (!Array.isArray(coordinates) || coordinates.length !== 2 || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number")) {
    return res.status(400).json({ success: false, message: "Coordinates must be an array of two numbers [lng, lat]" });
  }

  const retention = Number(retentionFundAmountInr);
  if (isNaN(retention) || retention < 0) {
    return res.status(400).json({ success: false, message: "retentionFundAmountInr must be a non-negative number" });
  }

  try {
    const coords = Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [72.8347, 19.0596];

    const contract = await RoadContract.create({
      contractId: String(contractId).trim(),
      roadName: roadName.trim(),
      contractorId: req.body.contractorId ? String(req.body.contractorId).trim() : `CON-${Date.now().toString().slice(-4)}`,
      contractorName: contractorName.trim(),
      ward: ward.trim(),
      completionDate: completionDate ? new Date(completionDate) : new Date(Date.now() - 180 * 86400000),
      dlpExpiryDate: dlpExpiryDate ? new Date(dlpExpiryDate) : new Date(Date.now() + 730 * 86400000),
      retentionFundAmountInr: retention,
      status: status === "WARRANTY_EXPIRED" ? "WARRANTY_EXPIRED" : "ACTIVE_WARRANTY",
      geometry: {
        type: "Point",
        coordinates: coords,
      },
    });

    invalidateCache(["dlp:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `Road contract "${contract.roadName}" created successfully`,
      contract,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to create road contract" });
  }
});
