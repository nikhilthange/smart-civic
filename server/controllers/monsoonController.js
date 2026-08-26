"use strict";

const asyncHandler = require("express-async-handler");
const DesiltingRecord = require("../models/DesiltingRecord");
const {
  CHRONIC_HOTSPOTS,
  PUMPING_STATIONS,
  getArabianSeaTideStatus,
  calculateWaterlogRisk,
  verifyDesiltingProof,
} = require("../services/monsoonService");

/**
 * @route   GET /api/monsoon/flood-radar
 * @desc    Get live Mumbai waterlogging risk across chronic hotspots & SWD pumping telemetry
 * @access  Public / Authenticated
 */
exports.getFloodRadar = asyncHandler(async (req, res) => {
  const rainMmPerHr = parseFloat(req.query.rainfallMm || "48.5");
  const tideInfo = getArabianSeaTideStatus();

  const hotspotRisks = CHRONIC_HOTSPOTS.map((spot) => {
    const risk = calculateWaterlogRisk(rainMmPerHr, tideInfo.tideHeightMeters, spot);
    return {
      ...spot,
      ...risk,
    };
  });

  const criticalHotspotCount = hotspotRisks.filter((h) => h.alertLevel === "RED_EMERGENCY").length;
  const totalPumpDischargeCapacity = PUMPING_STATIONS.reduce(
    (acc, p) => acc + (p.dischargeCapacityCubicMPerSec * (p.activePumps / p.totalPumps)),
    0
  );

  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    telemetry: {
      currentRainfallMmPerHr: rainMmPerHr,
      tide: tideInfo,
      overallCityStatus: criticalHotspotCount > 0 ? "RED_ALERT" : "AMBER_WATCH",
      activeFloodHotspots: criticalHotspotCount,
      totalActivePumpingCapacityCubicMPerSec: parseFloat(totalPumpDischargeCapacity.toFixed(1)),
    },
    hotspots: hotspotRisks,
    pumpingStations: PUMPING_STATIONS,
  });
});

/**
 * @route   POST /api/monsoon/verify-desilting
 * @desc    Submit & verify pre/post monsoon nullah desilting proofs with AI bed depth estimation
 * @access  Protected (Officers, Admin, Contractors)
 */
exports.verifyDesilting = asyncHandler(async (req, res) => {
  const {
    nullahId,
    nullahName,
    ward,
    targetSiltTonnage = 1200,
    extractedSiltTonnage = 1150,
    preDesiltingBedDepthMeters = 1.2,
    contractorId = "CONTR-SWD-904",
    contractorName = "Apex Marine Infra Pvt Ltd",
    preMonsoonPhotoUrl,
    postMonsoonPhotoUrl,
  } = req.body;

  if (!nullahId || !nullahName || !ward) {
    res.status(400);
    throw new Error("Please provide nullahId, nullahName, and ward");
  }

  const verification = verifyDesiltingProof({
    preBedDepthMeters: Number(preDesiltingBedDepthMeters),
    reportedExtractedTonnage: Number(extractedSiltTonnage),
    targetTonnage: Number(targetSiltTonnage),
    prePhotoUrl,
    postPhotoUrl,
  });

  let record = await DesiltingRecord.findOne({ nullahId, ward });
  if (!record) {
    record = new DesiltingRecord({
      nullahId,
      nullahName,
      ward,
      targetSiltTonnage,
      extractedSiltTonnage,
      preDesiltingBedDepthMeters,
      postDesiltingBedDepthMeters: verification.estimatedPostDepthMeters,
      aiVerificationStatus: verification.verificationStatus,
      aiEstimatedDepthGainMeters: verification.depthGainMeters,
      contractorId,
      contractorName,
      preMonsoonPhotoUrl: preMonsoonPhotoUrl || "",
      postMonsoonPhotoUrl: postMonsoonPhotoUrl || "",
    });
  } else {
    record.extractedSiltTonnage = extractedSiltTonnage;
    record.postDesiltingBedDepthMeters = verification.estimatedPostDepthMeters;
    record.aiVerificationStatus = verification.verificationStatus;
    record.aiEstimatedDepthGainMeters = verification.depthGainMeters;
    if (preMonsoonPhotoUrl) record.preMonsoonPhotoUrl = preMonsoonPhotoUrl;
    if (postMonsoonPhotoUrl) record.postMonsoonPhotoUrl = postMonsoonPhotoUrl;
  }

  await record.save();

  res.status(200).json({
    success: true,
    message: verification.auditNotes,
    verification,
    record,
  });
});

/**
 * @route   GET /api/monsoon/nullahs
 * @desc    Get nullah desilting records across wards
 * @access  Public / Authenticated
 */
exports.getNullahRecords = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  const records = await DesiltingRecord.find(filter).sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    count: records.length,
    records,
  });
});
