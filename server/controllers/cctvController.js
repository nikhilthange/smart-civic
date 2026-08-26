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
  let cameras = await CctvCamera.find(filter).sort({ feedStatus: 1 });

  if (cameras.length === 0) {
    cameras = DEFAULT_CCTV_CAMERAS.filter((c) => !ward || ward === "all" || c.ward === ward);
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
