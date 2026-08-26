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
