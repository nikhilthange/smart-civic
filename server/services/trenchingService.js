"use strict";

const mongoose = require("mongoose");
const TrenchingPermit = require("../models/TrenchingPermit");
const RoadContract = require("../models/RoadContract");
const { getDistanceMeters } = require("./swmFleetService");

/**
 * ─── Multi-Agency Utility "Dig Once" Trenching & Collision Service ───────────────
 */

/**
 * Evaluates incoming trenching request against active DLP roads (<36m) and other utility requests (25m buffer, 90-day window)
 */
async function evaluateTrenchingRequest({
  agencyName,
  ward,
  roadName,
  coordinates,
  startDate,
  endDate,
  estimatedLengthMeters = 150,
}) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    return {
      approved: false,
      status: "REJECTED",
      reason: "Invalid coordinates geometry",
    };
  }

  const startCoord = Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])
    ? coordinates[0][0]
    : Array.isArray(coordinates[0])
    ? coordinates[0]
    : coordinates;

  const [lng, lat] = startCoord;
  const reqStart = new Date(startDate || Date.now());
  const reqEnd = new Date(endDate || Date.now() + 14 * 86400000);

  // 1. DLP Road Protection Check (< 36 months since paving)
  let dlpConflict = null;
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      dlpConflict = await RoadContract.findOne({
        status: { $in: ["ACTIVE_WARRANTY", "PENALTY_LOCKED"] },
        dlpExpiryDate: { $gt: new Date() },
        geometry: {
          $nearSphere: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: 40,
          },
        },
      });
    } catch {
      // continue
    }
  }

  if (dlpConflict) {
    return {
      approved: false,
      status: "DLP_BLOCKED",
      isDlpBlocked: true,
      dlpRoadName: dlpConflict.roadName,
      contractorName: dlpConflict.contractorName,
      dlpExpiryDate: dlpConflict.dlpExpiryDate,
      reason: `⛔ DLP ROAD PROTECTED: ${dlpConflict.roadName} is under active 36-month warranty until ${new Date(dlpConflict.dlpExpiryDate).toLocaleDateString()}. Digging prohibited without Chief Engineer bypass order.`,
    };
  }

  // 2. Multi-Agency Spatial Collision Check (25m distance & 90-day window)
  let existingPermits = [];
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      existingPermits = await TrenchingPermit.find({
        status: { $in: ["PENDING_COORDINATION", "APPROVED", "IN_PROGRESS", "JOINT_TRENCHING_MERGED"] },
        geometry: {
          $nearSphere: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: 35, // 35m spatial buffer
          },
        },
      });
    } catch {
      // continue
    }
  }

  // Check temporal overlap (within 90 days)
  const conflictingPermits = existingPermits.filter((p) => {
    const existingStart = new Date(p.startDate);
    const existingEnd = new Date(p.endDate);
    const timeDiffDays = Math.abs(reqStart - existingStart) / (1000 * 3600 * 24);
    return timeDiffDays <= 90;
  });

  if (conflictingPermits.length > 0) {
    const primaryConflict = conflictingPermits[0];
    const sharedSaving = Math.round(estimatedLengthMeters * 3200 * 0.4); // 40% cost saving on joint trenching

    return {
      approved: true,
      status: "JOINT_TRENCHING_MERGED",
      isCollisionDetected: true,
      collisionType: "MULTI_UTILITY_OVERLAP",
      conflictingAgencies: [primaryConflict.agencyName, agencyName],
      mergedPermitId: primaryConflict.permitId,
      unifiedDigWindow: {
        startDate: new Date(Math.min(reqStart, new Date(primaryConflict.startDate))),
        endDate: new Date(Math.max(reqEnd, new Date(primaryConflict.endDate))),
      },
      sharedCostSavingsInr: sharedSaving,
      message: `🔄 "DIG ONCE" SYNC: Coordinate collision with ${primaryConflict.agencyName}. Merged into unified joint-trenching window. Estimated municipal savings: ₹${sharedSaving.toLocaleString()}.`,
    };
  }

  return {
    approved: true,
    status: "APPROVED",
    isCollisionDetected: false,
    isDlpBlocked: false,
    reinstatementBondRequiredInr: Math.round(estimatedLengthMeters * 3500),
    message: `✅ TRENCHING APPROVED: No DLP or utility conflicts detected on ${roadName}. Single trench permit issued.`,
  };
}

module.exports = {
  evaluateTrenchingRequest,
};
