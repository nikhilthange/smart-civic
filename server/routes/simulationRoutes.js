"use strict";

const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const simulationService = require("../services/simulationService");
const Complaint = require("../models/Complaint");
const SubwayStatus = require("../models/SubwayStatus");
const BinTelemetry = require("../models/BinTelemetry");
const CctvCamera = require("../models/CctvCamera");
const DilapidatedBuilding = require("../models/DilapidatedBuilding");

const { protect, authorize } = require("../middlewares/auth");
const { invalidateCache } = require("../middlewares/cacheMiddleware");

// Production Environment Guard
const prodSimulationGuard = (req, res, next) => {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_SIMULATION !== "true") {
    return res.status(403).json({
      success: false,
      message: "Simulation mutations are restricted in production. Enable ALLOW_PROD_SIMULATION=true.",
    });
  }
  next();
};

// Protect all mutation endpoints with auth & role authorization
const simMutationGuards = [protect, authorize("admin", "ward_officer", "officer", "superadmin"), prodSimulationGuard];

/**
 * @route   POST /api/simulator/generate
 * @desc    Generate N dynamic persistent complaints across Mumbai 24 wards (Max 25)
 * @access  Protected (Admin, Ward Officer)
 */
router.post(
  "/generate",
  simMutationGuards,
  asyncHandler(async (req, res) => {
    const count = Math.min(25, Math.max(1, parseInt(req.body.count || "3", 10)));
    const created = await simulationService.generateComplaints(count);
    invalidateCache(["sitrep:", "complaints:", "subway:", "cctv:", "/api/sitrep", "complaint:", "/api/complaints"]);
    res.status(201).json({
      success: true,
      message: `Generated and persisted ${created.length} live civic incident(s) across Mumbai wards.`,
      complaints: created,
    });
  })
);

/**
 * @route   POST /api/simulator/tick
 * @desc    Execute 1 live simulation step across all IoT and subway sensors
 * @access  Protected (Admin, Ward Officer)
 */
router.post(
  "/tick",
  simMutationGuards,
  asyncHandler(async (req, res) => {
    const result = await simulationService.tick();
    invalidateCache(["sitrep:", "complaints:", "subway:", "cctv:", "/api/sitrep", "complaint:", "/api/complaints"]);
    res.status(200).json({
      success: true,
      message: "Simulation tick completed. Telemetry updated and persisted in MongoDB.",
      ...result,
    });
  })
);

/**
 * @route   POST /api/simulator/subway-spike
 * @desc    Simulate water level spike at target subway underpass
 * @access  Protected (Admin, Ward Officer)
 */
router.post(
  "/subway-spike",
  simMutationGuards,
  asyncHandler(async (req, res) => {
    const { subwayId = "SUB-ANDHERI", depthCm = 45 } = req.body;
    const subway = await simulationService.simulateSubwaySpike(subwayId, depthCm);
    invalidateCache(["sitrep:", "complaints:", "subway:", "cctv:", "/api/sitrep", "complaint:", "/api/complaints"]);
    res.status(200).json({
      success: true,
      message: `Subway water depth updated to ${subway.waterDepthCm}cm. Traffic Status: ${subway.trafficStatus}`,
      subway,
    });
  })
);

/**
 * @route   POST /api/simulator/bin-fill
 * @desc    Simulate garbage bin overflow in target ward
 * @access  Protected (Admin, Ward Officer)
 */
router.post(
  "/bin-fill",
  simMutationGuards,
  asyncHandler(async (req, res) => {
    const { binId = "BIN-HW-042", fillPercentage = 95 } = req.body;
    const bin = await simulationService.simulateBinFill(binId, fillPercentage);
    invalidateCache(["sitrep:", "complaints:", "subway:", "cctv:", "/api/sitrep", "complaint:", "/api/complaints"]);
    res.status(200).json({
      success: true,
      message: `Bin ${bin.binId} fill level set to ${bin.currentFillPercentage}%. Status: ${bin.status}`,
      bin,
    });
  })
);

/**
 * @route   POST /api/simulator/building-tilt
 * @desc    Simulate structural tilt sensor spike on C1 dilapidated building
 * @access  Protected (Admin, Ward Officer)
 */
router.post(
  "/building-tilt",
  simMutationGuards,
  asyncHandler(async (req, res) => {
    const { buildingId = "BLD-C1-001", tiltMm = 14.5 } = req.body;
    const building = await simulationService.simulateBuildingTilt(buildingId, tiltMm);
    invalidateCache(["sitrep:", "complaints:", "subway:", "cctv:", "/api/sitrep", "complaint:", "/api/complaints"]);
    res.status(200).json({
      success: true,
      message: `Structural tilt sensor for ${building.buildingName} triggered at ${building.tiltSensorMm}mm. Evacuation: ${building.evacuationStatus}`,
      building,
    });
  })
);

/**
 * @route   POST /api/simulator/cctv-anomaly
 * @desc    Simulate CCTV edge AI detection anomaly
 * @access  Protected (Admin, Ward Officer)
 */
router.post(
  "/cctv-anomaly",
  simMutationGuards,
  asyncHandler(async (req, res) => {
    const { cameraId = "CAM-DDR-01", anomalyType = "DEBRIS_DUMPING" } = req.body;
    const camera = await simulationService.simulateCctvAnomaly(cameraId, anomalyType);
    invalidateCache(["sitrep:", "complaints:", "subway:", "cctv:", "/api/sitrep", "complaint:", "/api/complaints"]);
    res.status(200).json({
      success: true,
      message: `Camera ${camera.cameraId} anomaly detected: ${anomalyType}`,
      camera,
    });
  })
);

/**
 * @route   GET /api/simulator/status
 * @desc    Get live telemetry counts and simulation status
 * @access  Public / Authenticated
 */
router.get(
  "/status",
  asyncHandler(async (req, res) => {
    const [complaintsCount, subwaysCount, binsCount, camerasCount, buildingsCount] = await Promise.all([
      Complaint.countDocuments(),
      SubwayStatus.countDocuments(),
      BinTelemetry.countDocuments(),
      CctvCamera.countDocuments(),
      DilapidatedBuilding.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      status: "ACTIVE",
      timestamp: new Date().toISOString(),
      counts: {
        complaints: complaintsCount,
        subways: subwaysCount,
        bins: binsCount,
        cctvCameras: camerasCount,
        dilapidatedBuildings: buildingsCount,
      },
    });
  })
);

/**
 * @route   POST /api/simulator/batch-seed-all
 * @desc    Batch seed all 17 municipal collections with realistic live MongoDB records
 * @access  Protected (Admin, Ward Officer)
 */
router.post(
  "/batch-seed-all",
  simMutationGuards,
  asyncHandler(async (req, res) => {
    const result = await simulationService.batchSeedAllModules();
    res.status(200).json({
      success: true,
      message: "Successfully seeded all municipal collections with live MongoDB records!",
      ...result,
    });
  })
);

/**
 * @route   DELETE /api/simulator/cleanup
 * @desc    Clean up and delete all simulated records (isSimulated: true)
 * @access  Protected (Admin, Ward Officer)
 */
router.delete(
  "/cleanup",
  simMutationGuards,
  asyncHandler(async (req, res) => {
    const result = await simulationService.cleanupSimulatedData();
    res.status(200).json({
      success: true,
      message: `Cleaned up ${result.deletedTotal} simulated records.`,
      ...result,
    });
  })
);

module.exports = router;
