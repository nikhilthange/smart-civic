"use strict";

const mongoose = require("mongoose");
const CctvCamera = require("../models/CctvCamera");

/**
 * ─── CCTV / MCS Video Analytics & Zero-Touch Dispatch Engine ───────────────────
 */

const DEFAULT_CCTV_CAMERAS = [
  {
    cameraId: "CAM-DDR-01",
    cameraName: "Dadar TT Circle South Pole (PTZ-4K)",
    junction: "Dadar TT Circle / Dr. Babasaheb Ambedkar Road",
    ward: "Ward G-North",
    streamUrl: "https://cctv.mumbaipolice.gov.in/live/dadar_tt.m3u8",
    feedStatus: "ANOMALY_FLAGGED",
    activeAnalytics: ["DEBRIS_DUMPING", "WATERLOGGING", "ILLEGAL_ENCROACHMENT"],
    lastDetectedAnomaly: {
      anomalyType: "DEBRIS_DUMPING",
      confidence: 0.93,
      detectedAt: new Date(Date.now() - 900000),
      autoComplaintId: "SC-2026-CCTV-90112",
      boundingBox: [22, 38, 54, 42],
    },
    coordinates: [72.8437, 19.0178],
  },
  {
    cameraId: "CAM-BND-02",
    cameraName: "Bandra Linking Road Junction (Fixed-HD)",
    junction: "Linking Road & Turner Road Intersection",
    ward: "Ward H-West",
    streamUrl: "https://cctv.mumbaipolice.gov.in/live/bandra_linking.m3u8",
    feedStatus: "ONLINE_STREAMING",
    activeAnalytics: ["ILLEGAL_ENCROACHMENT", "TRAFFIC_GRIDLOCK"],
    lastDetectedAnomaly: null,
    coordinates: [72.8345, 19.0580],
  },
  {
    cameraId: "CAM-AND-03",
    cameraName: "Andheri West SV Road Sluice (Thermal-PTZ)",
    junction: "SV Road & Andheri Subway Approach",
    ward: "Ward K-West",
    streamUrl: "https://cctv.mumbaipolice.gov.in/live/andheri_subway.m3u8",
    feedStatus: "ANOMALY_FLAGGED",
    activeAnalytics: ["WATERLOGGING", "DEBRIS_DUMPING"],
    lastDetectedAnomaly: {
      anomalyType: "WATERLOGGING",
      confidence: 0.89,
      detectedAt: new Date(Date.now() - 300000),
      autoComplaintId: "SC-2026-CCTV-44019",
      boundingBox: [15, 45, 70, 35],
    },
    coordinates: [72.8420, 19.1180],
  },
];

/**
 * Analyzes video frame snapshot and detects municipal anomalies
 */
async function processCctvFrameAnomaly({
  cameraId = "CAM-DDR-01",
  simulatedAnomalyType = "DEBRIS_DUMPING",
  confidence = 0.94,
}) {
  let camera = DEFAULT_CCTV_CAMERAS.find((c) => c.cameraId === cameraId) || DEFAULT_CCTV_CAMERAS[0];

  const autoComplaintId = `SC-${new Date().getFullYear()}-CCTV-${Math.floor(10000 + Math.random() * 90000)}`;

  let boundingBox = [20, 30, 60, 40];
  let targetDepartment = "SWM";

  if (simulatedAnomalyType === "WATERLOGGING") {
    boundingBox = [15, 45, 70, 35];
    targetDepartment = "SWD";
  } else if (simulatedAnomalyType === "ILLEGAL_ENCROACHMENT") {
    boundingBox = [30, 25, 45, 50];
    targetDepartment = "LIC";
  }

  const anomalyRecord = {
    anomalyType: simulatedAnomalyType,
    confidence: Number(confidence),
    detectedAt: new Date(),
    autoComplaintId,
    boundingBox,
    targetDepartment,
  };

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const dbCam = await CctvCamera.findOne({ cameraId });
      if (dbCam) {
        dbCam.feedStatus = "ANOMALY_FLAGGED";
        dbCam.lastDetectedAnomaly = anomalyRecord;
        await dbCam.save();
        camera = dbCam;
      }
    } catch {
      // continue
    }
  }

  return {
    cameraId: camera.cameraId,
    cameraName: camera.cameraName,
    ward: camera.ward,
    junction: camera.junction,
    feedStatus: "ANOMALY_FLAGGED",
    anomaly: anomalyRecord,
    autoDispatchedComplaint: {
      complaintId: autoComplaintId,
      title: `CCTV Auto-Dispatch: ${simulatedAnomalyType.replace(/_/g, " ")} at ${camera.junction}`,
      department: targetDepartment,
      ward: camera.ward,
      source: "MUNICIPAL_CCTV_MCS_ANALYTICS",
      priority: "high",
      status: "AUTO_ASSIGNED_TO_WARD_CREW",
    },
    message: `🚨 CCTV ANOMALY DETECTED: ${(confidence * 100).toFixed(0)}% confidence ${simulatedAnomalyType} at ${camera.junction}. Zero-touch grievance ${autoComplaintId} generated.`,
  };
}

module.exports = {
  DEFAULT_CCTV_CAMERAS,
  processCctvFrameAnomaly,
};
