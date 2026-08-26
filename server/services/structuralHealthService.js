"use strict";

const mongoose = require("mongoose");
const DilapidatedBuilding = require("../models/DilapidatedBuilding");

/**
 * ─── C1 Category Dilapidated Building Collapse Radar Service ────────────────────
 */

const DEFAULT_BUILDINGS = [
  {
    buildingId: "BLD-GN-01",
    buildingName: "Siddharth Chawl Compound (C1)",
    ward: "Ward G-North",
    address: "Bhavani Shankar Road, Dadar West",
    structuralCategory: "C1_DEMOLISH_IMMEDIATE",
    occupancyStatus: "OCCUPIED",
    residentFamilyCount: 32,
    tiltAngleDegrees: 2.8,
    crackDisplacementMm: 14.5,
    vibrationIndexHz: 5.4,
    status: "IMMINENT_COLLAPSE_HAZARD",
    transitCampAllocated: true,
    transitCampLocation: "Sion-Koliwada BMC Transit Tenements Block C",
    coordinates: [72.8390, 19.0220],
  },
  {
    buildingId: "BLD-HW-02",
    buildingName: "Bandra Bazar Municipal Staff Quarters",
    ward: "Ward H-West",
    address: "Old Station Road, Bandra West",
    structuralCategory: "C2A_MAJOR_REPAIRS_EVACUATE",
    occupancyStatus: "PARTIALLY_EVACUATED",
    residentFamilyCount: 18,
    tiltAngleDegrees: 1.4,
    crackDisplacementMm: 8.2,
    vibrationIndexHz: 3.1,
    status: "ELEVATED_VIBRATION",
    transitCampAllocated: false,
    transitCampLocation: "Kurla West Transit Camp",
    coordinates: [72.8380, 19.0560],
  },
  {
    buildingId: "BLD-KW-03",
    buildingName: "Juhu Gulmohar Cooperative Housing (C1)",
    ward: "Ward K-West",
    address: "Gulmohar Cross Road 7, JVPD Scheme, Andheri West",
    structuralCategory: "C1_DEMOLISH_IMMEDIATE",
    occupancyStatus: "OCCUPIED",
    residentFamilyCount: 14,
    tiltAngleDegrees: 0.9,
    crackDisplacementMm: 5.8,
    vibrationIndexHz: 1.8,
    status: "STABLE_MONITORED",
    transitCampAllocated: false,
    transitCampLocation: "Goregaon East MHADA Transit Hub",
    coordinates: [72.8315, 19.1120],
  },
];

/**
 * Ingests micro-tiltmeter and crack gauge telemetry, evaluating collapse hazards
 */
async function processStructuralTelemetry({
  buildingId,
  tiltAngleDegrees = 2.8,
  crackDisplacementMm = 14.5,
  vibrationIndexHz = 5.0,
}) {
  const tilt = Number(tiltAngleDegrees);
  const crack = Number(crackDisplacementMm);
  const vibration = Number(vibrationIndexHz);

  const isImminentHazard = tilt >= 2.5 || crack > 12.0;

  const status = isImminentHazard
    ? "IMMINENT_COLLAPSE_HAZARD"
    : tilt >= 1.5 || crack >= 7.0
    ? "ELEVATED_VIBRATION"
    : "STABLE_MONITORED";

  let building = DEFAULT_BUILDINGS.find((b) => b.buildingId === buildingId) || DEFAULT_BUILDINGS[0];

  if (mongoose.connection && mongoose.connection.readyState === 1 && buildingId) {
    try {
      const dbBld = await DilapidatedBuilding.findOne({ buildingId });
      if (dbBld) {
        dbBld.tiltAngleDegrees = tilt;
        dbBld.crackDisplacementMm = crack;
        dbBld.vibrationIndexHz = vibration;
        dbBld.status = status;
        if (isImminentHazard) {
          dbBld.transitCampAllocated = true;
        }
        dbBld.lastTelemetryAt = new Date();
        await dbBld.save();
        building = dbBld;
      }
    } catch {
      // continue
    }
  }

  const evacuationNotice = isImminentHazard
    ? {
        orderId: `EVAC-${building.buildingId}-${Date.now().toString().slice(-4)}`,
        buildingName: building.buildingName,
        ward: building.ward,
        action: "MANDATORY_IMMEDIATE_EVACUATION",
        affectedFamilies: building.residentFamilyCount,
        allocatedTransitCamp: building.transitCampLocation,
        transitPassPrefix: `BMC-TC-PASS-${building.buildingId}`,
        disasterCellNotified: true,
        policeEscortDispatched: true,
        alertMessage: `🚨 CRITICAL STRUCTURAL COLLAPSE THREAT: Tilt (${tilt}°) >= 2.5° or Crack (${crack}mm) > 12mm on ${building.buildingName}. Mandatory evacuation enforced with ${building.residentFamilyCount} transit camp family passes generated.`,
      }
    : null;

  return {
    buildingId: building.buildingId,
    buildingName: building.buildingName,
    ward: building.ward,
    tiltAngleDegrees: tilt,
    crackDisplacementMm: crack,
    vibrationIndexHz: vibration,
    structuralCategory: building.structuralCategory,
    status,
    isImminentHazard,
    transitCampAllocated: isImminentHazard || building.transitCampAllocated,
    transitCampLocation: building.transitCampLocation,
    evacuationNotice,
    statusMessage: isImminentHazard
      ? `🚨 IMMINENT COLLAPSE HAZARD: Sensor threshold exceeded. Emergency evacuation order active.`
      : `✅ STRUCTURAL TELEMETRY NOMINAL: Deflection within safety tolerance for ${building.structuralCategory}.`,
  };
}

module.exports = {
  DEFAULT_BUILDINGS,
  processStructuralTelemetry,
};
