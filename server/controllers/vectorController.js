"use strict";

const asyncHandler = require("express-async-handler");
const VectorOutbreak = require("../models/VectorOutbreak");
const {
  DEFAULT_VECTOR_HOTSPOTS,
  calculateVectorRiskScore,
  generateFoggingRoute,
} = require("../services/vectorDiseaseService");

/**
 * @route   GET /api/vector/hotspots
 * @desc    Get all larval breeding hotspots and disease clusters
 * @access  Public / Authenticated
 */
exports.getVectorHotspots = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  let hotspots = await VectorOutbreak.find(filter).sort({ riskScore: -1 });

  if (hotspots.length === 0) {
    const list = DEFAULT_VECTOR_HOTSPOTS.filter((h) => !ward || ward === "all" || h.ward === ward);
    hotspots = list.map((h) => {
      const risk = calculateVectorRiskScore(h.reportedFeverCases, h.larvalBreedingIndex, h.stagnantWaterGrievanceCount);
      return {
        ...h,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        status: risk.sprayPriority,
      };
    });
  }

  res.status(200).json({
    success: true,
    count: hotspots.length,
    hotspots,
  });
});

/**
 * @route   GET /api/vector/fogging-route/:ward
 * @desc    Generate optimized TSP circuit for Pest Control Department (PSD) fogging truck
 * @access  Public / Authenticated
 */
exports.getPsdFoggingRoute = asyncHandler(async (req, res) => {
  const { ward = "Ward G-North" } = req.params;
  const route = generateFoggingRoute(ward);

  res.status(200).json({
    success: true,
    route,
  });
});
