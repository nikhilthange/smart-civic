"use strict";

const { getDistanceMeters } = require("./swmFleetService");

/**
 * ─── Epidemic Vector GIS & Predictive Fogging Dispatch Service ───────────────────
 */

const DEFAULT_VECTOR_HOTSPOTS = [
  {
    clusterId: "VEC-GN-01",
    ward: "Ward G-North",
    locality: "Dharavi Kumbharwada & Transit Camp",
    diseaseType: "DENGUE",
    reportedFeverCases: 28,
    larvalBreedingIndex: 78,
    stagnantWaterGrievanceCount: 14,
    coordinates: [72.8550, 19.0410],
  },
  {
    clusterId: "VEC-GN-02",
    ward: "Ward G-North",
    locality: "Dadar Railway Colony & Fish Market",
    diseaseType: "MALARIA",
    reportedFeverCases: 19,
    larvalBreedingIndex: 62,
    stagnantWaterGrievanceCount: 9,
    coordinates: [72.8430, 19.0210],
  },
  {
    clusterId: "VEC-HW-03",
    ward: "Ward H-West",
    locality: "Khar Danda Fisherman Village",
    diseaseType: "LEPTOSPIROSIS",
    reportedFeverCases: 16,
    larvalBreedingIndex: 54,
    stagnantWaterGrievanceCount: 8,
    coordinates: [72.8280, 19.0750],
  },
  {
    clusterId: "VEC-KW-04",
    ward: "Ward K-West",
    locality: "Versova Creek & Construction Pits",
    diseaseType: "DENGUE",
    reportedFeverCases: 24,
    larvalBreedingIndex: 72,
    stagnantWaterGrievanceCount: 12,
    coordinates: [72.8190, 19.1380],
  },
];

/**
 * Calculates weighted Vector Risk Score (0-100) combining fever cases, larval index, and stagnant water reports
 */
function calculateVectorRiskScore(feverCases = 15, larvalIndex = 50, stagnantGrievances = 5) {
  const cases = Number(feverCases);
  const index = Number(larvalIndex);
  const stagnant = Number(stagnantGrievances);

  // Weighted formula: Cases (40%) + Larval Breteau Index (40%) + Citizen Grievance Count (20%)
  const score = Math.min(
    100,
    Math.round(cases * 2.2 + index * 0.45 + stagnant * 2.5)
  );

  let riskLevel = "LOW";
  let sprayPriority = "ROUTINE_WEEKLY";
  if (score >= 70) {
    riskLevel = "CRITICAL_EPIDEMIC_SURGE";
    sprayPriority = "IMMEDIATE_24H_PSD_THERMAL_FOGGING";
  } else if (score >= 45) {
    riskLevel = "MODERATE";
    sprayPriority = "SCHEDULED_BIWEEKLY_MISTING";
  }

  return {
    riskScore: score,
    riskLevel,
    sprayPriority,
  };
}

/**
 * Generates prioritized TSP circuit for Pest Control Department (PSD) motorized fogging trucks
 */
function generateFoggingRoute(ward = "Ward G-North") {
  const hotspots = DEFAULT_VECTOR_HOTSPOTS.filter((h) => !ward || ward === "all" || h.ward === ward);

  const enrichedHotspots = (hotspots.length > 0 ? hotspots : DEFAULT_VECTOR_HOTSPOTS).map((h) => {
    const risk = calculateVectorRiskScore(h.reportedFeverCases, h.larvalBreedingIndex, h.stagnantWaterGrievanceCount);
    return {
      ...h,
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel,
      sprayPriority: risk.sprayPriority,
    };
  });

  // Sort by highest risk score descending
  enrichedHotspots.sort((a, b) => b.riskScore - a.riskScore);

  let totalDistanceMeters = 0;
  for (let i = 0; i < enrichedHotspots.length - 1; i++) {
    const p1 = enrichedHotspots[i].coordinates;
    const p2 = enrichedHotspots[i + 1].coordinates;
    totalDistanceMeters += getDistanceMeters(p1[1], p1[0], p2[1], p2[0]);
  }

  return {
    ward,
    shiftTarget: "EVENING_TWILIGHT_FOGGING (18:00 - 20:30 IST)",
    chemicalFormulation: "Pyrethrum Extract 2% + Diesel Carrier",
    totalWaypoints: enrichedHotspots.length,
    estimatedCircuitKm: parseFloat((totalDistanceMeters / 1000).toFixed(2)),
    estimatedTimeMinutes: Math.round(enrichedHotspots.length * 35),
    optimizedStops: enrichedHotspots,
    dispatchAlert: `🦟 PSD FOGGING ORDER: Route dispatched covering ${enrichedHotspots.length} high-density vector clusters in ${ward}.`,
  };
}

module.exports = {
  DEFAULT_VECTOR_HOTSPOTS,
  calculateVectorRiskScore,
  generateFoggingRoute,
};
