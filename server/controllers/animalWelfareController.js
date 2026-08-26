"use strict";

const asyncHandler = require("express-async-handler");
const AnimalWelfareRecord = require("../models/AnimalWelfareRecord");
const {
  DEFAULT_ANIMAL_HOTSPOTS,
  calculateRabiesRiskIndex,
  generateVeterinaryDrive,
} = require("../services/animalWelfareService");

/**
 * @route   GET /api/animal-welfare/hotspots
 * @desc    Get all animal welfare hotspots, rabies risk scores, and cattle impound logs
 * @access  Public / Authenticated
 */
exports.getAnimalHotspots = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  let records = await AnimalWelfareRecord.find(filter).sort({ reportedDogBites30Days: -1 });

  if (records.length === 0) {
    const list = DEFAULT_ANIMAL_HOTSPOTS.filter((h) => !ward || ward === "all" || h.ward === ward);
    records = list.map((h) => {
      const risk = calculateRabiesRiskIndex(h.reportedDogBites30Days, h.packAggressionScore);
      return {
        ...h,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        recommendedAction: risk.recommendedAction,
      };
    });
  }

  res.status(200).json({
    success: true,
    count: records.length,
    hotspots: records,
  });
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
