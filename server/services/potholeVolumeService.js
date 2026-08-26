"use strict";

const mongoose = require("mongoose");
const RoadContract = require("../models/RoadContract");

/**
 * ─── 3D Pothole Volume Estimation & DLP Warranty Service ─────────────────────────
 */

/**
 * Calculates 3D Pothole Surface Area, Depth, Asphalt Volume, and Repair Mix Required
 * @param {object} params - Pothole dimensions or vision bbox aspect ratios
 */
function estimatePotholeVolume({ lengthCm = 85, widthCm = 65, depthCm = 9.5, surfaceType = "MASTIC_ASPHALT" }) {
  // Convert dimensions to meters
  const lengthMeters = lengthCm / 100;
  const widthMeters = widthCm / 100;
  const depthMeters = depthCm / 100;

  // Approximate elliptical surface area: π * (L/2) * (W/2)
  const surfaceAreaSqMeters = parseFloat((Math.PI * (lengthMeters / 2) * (widthMeters / 2)).toFixed(3));

  // Volumetric calculation (ellipsoidal cap profile): ~ 0.65 * Area * Depth
  const volumeCubicMeters = parseFloat((surfaceAreaSqMeters * depthMeters * 0.75).toFixed(4));

  // Density of compacted cold mix / mastic asphalt: ~ 2.35 tonnes / m³
  const asphaltDensityTonnePerM3 = surfaceType === "MASTIC_ASPHALT" ? 2.4 : 2.25;
  const requiredAsphaltTonnes = parseFloat((volumeCubicMeters * asphaltDensityTonnePerM3).toFixed(3));
  const coldMixBagsRequired = Math.ceil((requiredAsphaltTonnes * 1000) / 25); // 25kg standard cold-mix bags

  const estimatedLaborMinutes = Math.min(180, Math.max(30, Math.round(surfaceAreaSqMeters * 45)));

  return {
    dimensions: { lengthCm, widthCm, depthCm },
    surfaceAreaSqMeters,
    volumeCubicMeters,
    requiredAsphaltTonnes,
    coldMixBagsRequired,
    estimatedLaborMinutes,
    materialType: surfaceType,
    severityRating:
      depthCm >= 10 || surfaceAreaSqMeters >= 0.8
        ? "CRITICAL_DEPTH"
        : depthCm >= 5 || surfaceAreaSqMeters >= 0.3
          ? "MODERATE_DEFECT"
          : "MINOR_SURFACE_WEAR",
  };
}

/**
 * Checks if a coordinate falls within an active DLP Road Contract segment (50m buffer)
 * @param {Array} coordinates - [longitude, latitude]
 * @param {string} ward - Ward name
 */
async function checkDlpRoadWarranty(coordinates, ward) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
    return { isDlpViolation: false, contract: null };
  }

  const [lng, lat] = coordinates;

  let contracts = [];
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      contracts = await RoadContract.find({
        status: { $in: ["ACTIVE_WARRANTY", "PENALTY_LOCKED", "REPAIR_IN_PROGRESS"] },
        dlpExpiryDate: { $gt: new Date() },
        geometry: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: 50, // 50-meter buffer
          },
        },
      });
    } catch {
      // fallback
    }
  }

  if (!contracts || contracts.length === 0) {
    return {
      isDlpViolation: false,
      contract: null,
      message: "Standard municipal road maintenance (No active contractor warranty).",
    };
  }

  const contract = contracts[0];
  const now = new Date();
  const remainingMonths = Math.max(
    0,
    Math.round((new Date(contract.dlpExpiryDate) - now) / (1000 * 60 * 60 * 24 * 30.4))
  );

  return {
    isDlpViolation: true,
    contract,
    contractId: contract.contractId,
    contractorId: contract.contractorId,
    contractorName: contract.contractorName,
    roadName: contract.roadName,
    warrantyRemainingMonths: remainingMonths,
    retentionFundFrozen: contract.retentionFundFrozen,
    retentionFundAmountInr: contract.retentionFundAmountInr,
    actionRequired: "ZERO_MUNICIPAL_COST_CONTRACTOR_REPAIR",
    message: `🚨 DLP WARRANTY BREACH: ${contract.roadName} is under 36-month warranty with ${contract.contractorName}. Repair order routed to contractor at ZERO municipal expense.`,
  };
}

/**
 * Freezes the contractor's retention deposit upon repeated or unaddressed DLP breach
 */
async function freezeContractorRetention(contractId, reason = "SLA Breach on active DLP warranty road") {
  const contract = await RoadContract.findOne({ contractId });
  if (!contract) return null;

  contract.retentionFundFrozen = true;
  contract.status = "PENALTY_LOCKED";
  contract.activeDefectCount += 1;
  await contract.save();

  return {
    frozen: true,
    contractId: contract.contractId,
    contractorName: contract.contractorName,
    retentionFundAmountInr: contract.retentionFundAmountInr,
    reason,
  };
}

module.exports = {
  estimatePotholeVolume,
  checkDlpRoadWarranty,
  freezeContractorRetention,
};
