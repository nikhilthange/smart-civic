"use strict";

const asyncHandler = require("express-async-handler");
const AnimalWelfareRecord = require("../models/AnimalWelfareRecord");
const { calculateRabiesRiskIndex, generateVeterinaryDrive } = require("../services/animalWelfareService");
const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   GET /api/animal-welfare/hotspots
 * @desc    Get all animal welfare hotspots, rabies risk scores, and cattle impound logs
 * @access  Public / Authenticated
 */
exports.getAnimalHotspots = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  const records = await AnimalWelfareRecord.find(filter).sort({ reportedDogBites30Days: -1 }).lean();

  res.status(200).json({
    success: true,
    count: records.length,
    hotspots: records,
  });
});

/**
 * @route   POST /api/animal-welfare/hotspots
 * @desc    Register a new animal welfare hotspot cluster in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createAnimalRecord = asyncHandler(async (req, res) => {
  const {
    clusterId = `ANM-${Date.now().toString().slice(-5)}`,
    ward,
    locality,
    strayDogPopulation = 45,
    sterilizedCount = 18,
    reportedDogBites30Days = 8,
    packAggressionScore = 65,
    cattleNuisanceReports = 3,
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
    const bites = Math.max(0, Number(reportedDogBites30Days) || 0);
    const aggression = Math.max(0, Number(packAggressionScore) || 0);
    const risk = calculateRabiesRiskIndex(bites, aggression);

    const record = await AnimalWelfareRecord.create({
      clusterId: String(clusterId).trim(),
      ward: ward.trim(),
      locality: locality.trim(),
      strayDogPopulation: Math.max(0, Number(strayDogPopulation) || 0),
      sterilizedCount: Math.max(0, Number(sterilizedCount) || 0),
      reportedDogBites30Days: bites,
      packAggressionScore: aggression,
      cattleNuisanceReports: Math.max(0, Number(cattleNuisanceReports) || 0),
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel,
      recommendedAction: risk.recommendedAction,
      location: {
        type: "Point",
        coordinates: coords,
      },
    });

    invalidateCache(["animal-welfare:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `Animal welfare record "${record.clusterId}" registered successfully`,
      record,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to create animal welfare record" });
  }
});

/**
 * @route   POST /api/animal-welfare/log-bite
 * @desc    Log dispensary bite incident or citizen aggression report, auto-recalculating risk index
 * @access  Public / Authenticated
 */
exports.logBiteIncident = asyncHandler(async (req, res) => {
  const {
    ward = "Ward G-North",
    locality = "Dharavi 90 Feet Road",
    dogBitesCount = 14,
    packAggressionScore = 80,
  } = req.body;

  const risk = calculateRabiesRiskIndex(Number(dogBitesCount), Number(packAggressionScore));

  res.status(200).json({
    success: true,
    ward,
    locality,
    dogBitesCount: Number(dogBitesCount),
    packAggressionScore: Number(packAggressionScore),
    ...risk,
  });
});

/**
 * @route   POST /api/animal-welfare/vaccination-drive
 * @desc    Dispatch targeted mobile ABC sterilization van and anti-rabies inoculations
 * @access  Protected (Admin / Veterinary Officer)
 */
exports.dispatchVeterinaryDrive = asyncHandler(async (req, res) => {
  const { ward = "Ward G-North" } = req.body;
  const drive = generateVeterinaryDrive(ward);

  res.status(200).json({
    success: true,
    drive,
  });
});
