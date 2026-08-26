"use strict";

const mongoose = require("mongoose");
const SubwayStatus = require("../models/SubwayStatus");

/**
 * ─── Flooded Subway Dynamic Detour & Evacuation Router Service ───────────────────
 */

const DEFAULT_SUBWAYS = [
  {
    subwayId: "SUB-ANDHERI",
    subwayName: "Andheri East-West Subway",
    ward: "Ward K-West",
    waterDepthCm: 38,
    criticalThresholdCm: 30,
    trafficStatus: "SUBMERGED_CLOSED",
    safeDetourCorridor: "Gokhale Bridge Flyover & S.V. Road Junction",
    alternateFlyoverName: "Gokhale Rail Overbridge",
    activePumpsCount: 6,
    coordinates: [72.8440, 19.1197],
  },
  {
    subwayId: "SUB-MILAN",
    subwayName: "Milan Subway (Santacruz)",
    ward: "Ward H-West",
    waterDepthCm: 18,
    criticalThresholdCm: 30,
    trafficStatus: "OPEN",
    safeDetourCorridor: "Milan Rail Flyover Elevated Corridor",
    alternateFlyoverName: "Milan Elevated Flyover",
    activePumpsCount: 4,
    coordinates: [72.8390, 19.0820],
  },
  {
    subwayId: "SUB-MALAD",
    subwayName: "Malad Subway (SV Road to WEH)",
    ward: "Ward P-North",
    waterDepthCm: 34,
    criticalThresholdCm: 30,
    trafficStatus: "SUBMERGED_CLOSED",
    safeDetourCorridor: "Chincholi Bunder Flyover & Link Road",
    alternateFlyoverName: "Malad Chincholi Flyover",
    activePumpsCount: 5,
    coordinates: [72.8460, 19.1860],
  },
  {
    subwayId: "SUB-DAHISAR",
    subwayName: "Dahisar Subway (Near Station)",
    ward: "Ward R-North",
    waterDepthCm: 14,
    criticalThresholdCm: 30,
    trafficStatus: "OPEN",
    safeDetourCorridor: "Anand Nagar Flyover Western Express Highway",
    alternateFlyoverName: "Dahisar Toll Flyover",
    activePumpsCount: 3,
    coordinates: [72.8590, 19.2560],
  },
  {
    subwayId: "SUB-KHAR",
    subwayName: "Khar Subway (Golibar Junction)",
    ward: "Ward H-East",
    waterDepthCm: 22,
    criticalThresholdCm: 30,
    trafficStatus: "RESTRICTED_SINGLE_LANE",
    safeDetourCorridor: "Bandra-Kurla Link Flyover",
    alternateFlyoverName: "Kalanagar Elevated Corridor",
    activePumpsCount: 4,
    coordinates: [72.8395, 19.0700],
  },
];

/**
 * Inundation depth evaluator: closes subway if >= 30cm and computes dynamic detour routing
 */
function evaluateSubwayInundation(subwayId, depthCm) {
  const depth = Number(depthCm);
  const subway = DEFAULT_SUBWAYS.find((s) => s.subwayId === subwayId) || DEFAULT_SUBWAYS[0];

  let trafficStatus = "OPEN";
  let alertSeverity = "GREEN";

  if (depth >= subway.criticalThresholdCm) {
    trafficStatus = "SUBMERGED_CLOSED";
    alertSeverity = "RED_EMERGENCY";
  } else if (depth >= 20) {
    trafficStatus = "RESTRICTED_SINGLE_LANE";
    alertSeverity = "AMBER_WARNING";
  }

  const isClosed = trafficStatus === "SUBMERGED_CLOSED";

  const broadcastAlert = isClosed
    ? {
        alertId: `EMG-${subwayId}-${Date.now().toString().slice(-4)}`,
        targetRadiusKm: 1.5,
        title: `⛔ EMERGENCY: ${subway.subwayName} SUBMERGED & CLOSED`,
        smsText: `[BMC TRAFFIC ALERT] ${subway.subwayName} is CLOSED due to ${depth}cm flood water. Divert via ${subway.alternateFlyoverName}. Avoid underpass.`,
        suggestedBypass: subway.safeDetourCorridor,
        alternateFlyover: subway.alternateFlyoverName,
      }
    : null;

  return {
    subwayId: subway.subwayId,
    subwayName: subway.subwayName,
    ward: subway.ward,
    currentWaterDepthCm: depth,
    criticalThresholdCm: subway.criticalThresholdCm,
    trafficStatus,
    alertSeverity,
    isClosed,
    detourCorridor: subway.safeDetourCorridor,
    alternateFlyoverName: subway.alternateFlyoverName,
    activePumpsCount: subway.activePumpsCount,
    broadcastAlert,
    statusMessage: isClosed
      ? `🚨 WATER LEVEL CRITICAL: Depth (${depth}cm) >= 30cm. Hydraulic flood gates locked. Traffic diverted to ${subway.alternateFlyoverName}.`
      : `✅ SUBWAY PASSABLE: Water depth (${depth}cm) within safe motorable parameters.`,
  };
}

module.exports = {
  DEFAULT_SUBWAYS,
  evaluateSubwayInundation,
};
