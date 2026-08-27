"use strict";

const asyncHandler = require("express-async-handler");
const VectorOutbreak = require("../models/VectorOutbreak");
const { calculateVectorRiskScore, generateFoggingRoute } = require("../services/vectorDiseaseService");
const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   GET /api/vector/hotspots
 * @desc    Get all larval breeding hotspots and disease clusters
 * @access  Public / Authenticated
 */
exports.getVectorHotspots = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  const hotspots = await VectorOutbreak.find(filter).sort({ riskScore: -1 }).lean();

  res.status(200).json({
    success: true,
    count: hotspots.length,
    hotspots,
  });
});

/**
 * @route   POST /api/vector/hotspots
 * @desc    Create a new vector disease cluster hotspot in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createVectorHotspot = asyncHandler(async (req, res) => {
  const {
    clusterId = `VEC-${Date.now().toString().slice(-5)}`,
    ward,
    locality,
    diseaseType = "DENGUE",
    reportedFeverCases = 12,
    larvalBreedingIndex = 22,
    stagnantWaterGrievanceCount = 5,
    coordinates,
  } = req.body;

  if (!ward || typeof ward !== "string" || !ward.trim()) {
    return res.status(400).json({ success: false, message: "Valid ward string is required" });
  }

  if (!locality || typeof locality !== "string" || !locality.trim()) {
    return res.status(400).json({ success: false, message: "Valid locality string is required" });
  }

  if (coordinates && (!Array.isArray(coordinates) || coordinates.length !== 2 || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number")) {
    return res.status(400).json({ success: false, message: "Coordinates must be an array of two numbers [lng, lat]" });
  }

  try {
    const coords = Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [72.8450, 19.0180];
    const fever = Math.max(0, Number(reportedFeverCases) || 0);
    const larval = Math.max(0, Number(larvalBreedingIndex) || 0);
    const water = Math.max(0, Number(stagnantWaterGrievanceCount) || 0);
    const risk = calculateVectorRiskScore(fever, larval, water);

    const hotspot = await VectorOutbreak.create({
      clusterId: String(clusterId).trim(),
      ward: ward.trim(),
      locality: locality.trim(),
      diseaseType,
      reportedFeverCases: fever,
      larvalBreedingIndex: larval,
      stagnantWaterGrievanceCount: water,
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel,
      status: risk.sprayPriority,
      location: {
        type: "Point",
        coordinates: coords,
      },
    });

    invalidateCache(["vector:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `Vector outbreak cluster "${hotspot.clusterId}" registered successfully`,
      hotspot,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to create vector hotspot" });
  }
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
