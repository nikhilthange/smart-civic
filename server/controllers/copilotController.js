"use strict";

const asyncHandler = require("express-async-handler");
const {
  generateShowCauseNotice,
  generateWardSituationSummary,
} = require("../services/copilotService");

/**
 * @route   POST /api/copilot/generate-notice
 * @desc    Generates statutory contractor show-cause notice
 * @access  Protected (Admin / Officer)
 */
exports.generateNotice = asyncHandler(async (req, res) => {
  const {
    contractorName = "M/s Pratibha Infrastructure Pvt Ltd",
    roadOrProjectName = "Linking Road Bituminous Overlay",
    ward = "Ward H-West",
    violationType = "DLP_WARRANTY_BREACH",
    defectDescription = "Multiple surface craters and aggregate loss observed within 14 months during active 36-month DLP.",
    penaltyAmountInr = 150000,
  } = req.body;

  const result = generateShowCauseNotice({
    contractorName,
    roadOrProjectName,
    ward,
    violationType,
    defectDescription,
    penaltyAmountInr,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/copilot/ward-summary
 * @desc    Generates Executive Daily Ward Situation Summary
 * @access  Protected (Admin / Officer)
 */
exports.generateSummary = asyncHandler(async (req, res) => {
  const {
    ward = "Ward G-North",
    activeGrievancesCount = 42,
    criticalPotholesCount = 6,
    c1BuildingsCount = 2,
    tideHeightMeters = 4.35,
    rainfallMmHr = 28,
  } = req.body;

  const result = generateWardSituationSummary({
    ward,
    activeGrievancesCount,
    criticalPotholesCount,
    c1BuildingsCount,
    tideHeightMeters,
    rainfallMmHr,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});
