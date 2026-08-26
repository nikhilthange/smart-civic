"use strict";

const asyncHandler = require("express-async-handler");
const {
  DEFAULT_GREEN_BOND_PORTFOLIO,
  DEFAULT_CARBON_STREAMS,
  calculatePredictiveWardBudget,
} = require("../services/greenBondService");

/**
 * @route   GET /api/green-bonds/portfolio
 * @desc    Get Municipal Green Climate Bond portfolio and carbon credit offsets
 * @access  Public / Authenticated
 */
exports.getGreenBondPortfolio = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    portfolio: DEFAULT_GREEN_BOND_PORTFOLIO,
    carbonStreams: DEFAULT_CARBON_STREAMS,
  });
});

/**
 * @route   POST /api/green-bonds/predictive-budget
 * @desc    Calculate predictive Ward CapEx/OpEx requirements based on defect telemetry
 * @access  Public / Authenticated
 */
exports.getPredictiveBudget = asyncHandler(async (req, res) => {
  const {
    ward = "Ward G-North",
    historicalRoadDefects = 140,
    nullahDesiltingLengthKm = 18.5,
    projectedRainfallAnomalyPercent = 15,
  } = req.body;

  const budget = calculatePredictiveWardBudget({
    ward,
    historicalRoadDefects: Number(historicalRoadDefects),
    nullahDesiltingLengthKm: Number(nullahDesiltingLengthKm),
    projectedRainfallAnomalyPercent: Number(projectedRainfallAnomalyPercent),
  });

  res.status(200).json({
    success: true,
    budget,
  });
});
