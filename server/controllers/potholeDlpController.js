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

const mongoose = require("mongoose");
const crypto = require("crypto");
const Complaint = require("../models/Complaint");
const ContractorScorecard = require("../models/ContractorScorecard");

/**
 * @route   GET /api/dlp/passport/:contractId
 * @desc    Get complete Digital Road Passport & Birth Certificate with live DLP warranty countdown & escrow status
 * @access  Public / Authenticated
 */
exports.getRoadPassport = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const isMongoId = mongoose.Types.ObjectId.isValid(contractId);
  const query = isMongoId ? { $or: [{ _id: contractId }, { contractId: contractId }] } : { contractId: contractId };

  let contract = await RoadContract.findOne(query);

  if (!contract) {
    // If not found by exact ID, fallback search by regex
    contract = await RoadContract.findOne({ roadName: new RegExp(contractId, "i") });
  }

  // Ensure default demo contract exists if DB was unseeded
  if (!contract && (contractId === "DLP-HW-8812" || contractId === "default")) {
    contract = await RoadContract.create({
      contractId: "DLP-HW-8812",
      roadName: "S.V. Road Khar Carriageway",
      contractorId: "CON-UNITY-01",
      contractorName: "M/s Unity Infrastructure Ltd",
      ward: "Ward H-West",
      surfaceType: "MASTIC_ASPHALT",
      completionDate: new Date(Date.now() - 180 * 86400000),
      dlpExpiryDate: new Date(Date.now() + 730 * 86400000),
      totalProjectCostInr: 25000000,
      retentionFundAmountInr: 2500000,
      status: "ACTIVE_WARRANTY",
      geometry: { type: "Point", coordinates: [72.8347, 19.0596] },
    });
  }

  if (!contract) {
    return res.status(404).json({
      success: false,
      message: `Road contract or passport not found for ID "${contractId}".`,
      sampleContractIds: ["DLP-HW-8812", "DLP-GN-9041"],
    });
  }

  // Calculate live DLP days remaining
  const now = Date.now();
  const expiry = new Date(contract.dlpExpiryDate).getTime();
  const completion = new Date(contract.completionDate).getTime();
  const totalWarrantyDays = Math.max(1, Math.round((expiry - completion) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(0, Math.round((now - completion) / (1000 * 60 * 60 * 24)));
  const warrantyProgressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / totalWarrantyDays) * 100)));
  const isWarrantyActive = daysRemaining > 0 && contract.status !== "WARRANTY_EXPIRED";

  // Fetch active complaints linked or in vicinity
  const coords = Array.isArray(contract.geometry?.coordinates) ? contract.geometry.coordinates : [72.8347, 19.0596];
  let linkedDefects = [];
  try {
    linkedDefects = await Complaint.find({
      $or: [
        { dlpContractId: contract.contractId },
        {
          ward: contract.ward,
          category: "roads_and_infrastructure",
        },
      ],
      status: { $nin: ["closed", "resolved"] },
    })
      .select("complaintId title category priority status createdAt location")
      .limit(6);
  } catch {
    linkedDefects = [];
  }

  // Fetch contractor rating if available
  let contractorRating = 94;
  try {
    const scorecard = await ContractorScorecard.findOne({ contractorName: contract.contractorName });
    if (scorecard) {
      contractorRating = scorecard.reliabilityScore || 94;
    }
  } catch {}

  // Generate cryptographic SHA-256 seal of the Road Birth Certificate
  const rawPayload = `${contract.contractId}|${contract.roadName}|${contract.ward}|${contract.contractorName}|${contract.dlpExpiryDate?.toISOString?.() || ""}|${contract.retentionFundAmountInr}`;
  const sha256Seal = crypto.createHash("sha256").update(rawPayload).digest("hex").toUpperCase();

  res.status(200).json({
    success: true,
    passport: {
      contractId: contract.contractId,
      roadName: contract.roadName,
      ward: contract.ward,
      surfaceType: contract.surfaceType || "MASTIC_ASPHALT",
      contractorName: contract.contractorName,
      contractorId: contract.contractorId,
      contractorRating,
      completionDate: contract.completionDate,
      dlpExpiryDate: contract.dlpExpiryDate,
      totalProjectCostInr: contract.totalProjectCostInr || 25000000,
      retentionFundAmountInr: contract.retentionFundAmountInr || 2500000,
      retentionFundFrozen: Boolean(contract.retentionFundFrozen),
      status: isWarrantyActive ? (contract.retentionFundFrozen ? "PENALTY_LOCKED" : "ACTIVE_WARRANTY") : "WARRANTY_EXPIRED",
      daysRemaining,
      totalWarrantyDays,
      warrantyProgressPercent,
      isWarrantyActive,
      coordinates: coords,
      linkedDefectsCount: linkedDefects.length,
      linkedDefects,
      sha256Seal,
      qrPayload: `SMARTCIVIC:ROAD:${contract.contractId}`,
      statutoryActClause: "MMC Act 1888 Section 64B & Contractor Warranty Clause 18.4",
      issuingAuthority: "Brihanmumbai Municipal Corporation (BMC) — Roads & Traffic Department",
    },
  });
});

