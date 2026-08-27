"use strict";

const asyncHandler = require("express-async-handler");
const CctvCamera = require("../models/CctvCamera");
const {
  DEFAULT_CCTV_CAMERAS,
  processCctvFrameAnomaly,
} = require("../services/cctvAnalyticsService");

/**
 * @route   GET /api/cctv/cameras
 * @desc    Get all CCTV/MCS cameras and active live stream anomaly statuses
 * @access  Public / Authenticated
 */
exports.getCctvCameras = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  let cameras = await CctvCamera.find(filter).sort({ feedStatus: 1 }).lean();

  if (cameras.length === 0 && (!ward || ward === "all")) {
    const simulationService = require("../services/simulationService");
    await simulationService.ensureCctvCameras();
    cameras = await CctvCamera.find(filter).sort({ feedStatus: 1 }).lean();
  }

  res.status(200).json({
    success: true,
    count: cameras.length,
    cameras,
  });
});

/**
 * @route   POST /api/cctv/analyze-frame
 * @desc    Simulate frame grabber YOLO anomaly detection & auto-dispatch zero-touch ticket
 * @access  Public / Authenticated
 */
exports.analyzeCctvFrame = asyncHandler(async (req, res) => {
  const {
    cameraId = "CAM-DDR-01",
    simulatedAnomalyType = "DEBRIS_DUMPING",
    confidence = 0.94,
  } = req.body;

  const result = await processCctvFrameAnomaly({
    cameraId,
    simulatedAnomalyType,
    confidence: Number(confidence),
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   POST /api/cctv/cameras
 * @desc    Register a new CCTV camera directly in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createCctvCamera = asyncHandler(async (req, res) => {
  const {
    cameraId = `CAM-${Date.now().toString().slice(-4)}`,
    cameraName,
    ward,
    locationDescription = "Key Traffic Junction",
    streamUrl,
    feedStatus = "ONLINE",
    coordinates,
  } = req.body;

  if (!cameraName || typeof cameraName !== "string" || !cameraName.trim()) {
    return res.status(400).json({ success: false, message: "Valid cameraName string is required" });
  }

  if (!ward || typeof ward !== "string" || !ward.trim()) {
    return res.status(400).json({ success: false, message: "Valid ward string is required" });
  }

  if (coordinates && (!Array.isArray(coordinates) || coordinates.length !== 2 || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number")) {
    return res.status(400).json({ success: false, message: "Coordinates must be an array of two numbers [lng, lat]" });
  }

  try {
    const coords = Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [72.8450, 19.0180];

    const camera = await CctvCamera.create({
      cameraId: String(cameraId).trim(),
      cameraName: cameraName.trim(),
      junction: locationDescription ? String(locationDescription).trim() : "Ward CCTV Junction",
      ward: ward.trim(),
      feedStatus: feedStatus === "OFFLINE" ? "OFFLINE_MAINTENANCE" : "ONLINE_STREAMING",
      streamUrl: streamUrl ? String(streamUrl).trim() : `https://cctv.smartcity.mumbai.gov.in/live/${String(cameraId).toLowerCase()}.m3u8`,
      location: {
        type: "Point",
        coordinates: coords,
      },
      lastDetectedAnomaly: {
        anomalyType: "TRAFFIC_GRIDLOCK",
        confidence: 0.95,
        detectedAt: new Date(),
        boundingBox: [10, 10, 30, 30],
      },
    });

    invalidateCache(["cctv:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `CCTV camera "${camera.cameraName}" registered successfully`,
      camera,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to create CCTV camera" });
  }
});
