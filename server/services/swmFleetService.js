"use strict";

const BinTelemetry = require("../models/BinTelemetry");

/**
 * ─── SWM Compactor Fleet GPS & RFID Bin Tracking Service ─────────────────────────
 */

// Ward SWM Planned Waste Collection Corridors
const WARD_ROUTES = {
  "Ward G-North": {
    routeId: "SWM-GN-01",
    corridorName: "Dadar-Shivaji Park Morning Circuit",
    stops: [
      { name: "Plaza Cinema Junction", coordinates: [72.8425, 19.0185] },
      { name: "Shivaji Park Gate 4", coordinates: [72.8385, 19.0270] },
      { name: "Portuguese Church Point", coordinates: [72.8360, 19.0205] },
      { name: "Sena Bhavan Sector", coordinates: [72.8402, 19.0232] },
    ],
  },
  "Ward H-West": {
    routeId: "SWM-HW-02",
    corridorName: "Bandra West Commercial Corridor",
    stops: [
      { name: "Hill Road Market", coordinates: [72.8325, 19.0555] },
      { name: "Linking Road Junction", coordinates: [72.8365, 19.0620] },
      { name: "Carter Road Promenade", coordinates: [72.8250, 19.0680] },
      { name: "Khar Danda Fish Market", coordinates: [72.8280, 19.0750] },
    ],
  },
};

/**
 * Calculate distance between two GPS coordinates in meters (Haversine formula)
 */
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return parseFloat((R * c).toFixed(1));
}

/**
 * Checks GPS trace of a compactor truck for route deviations and missed society bins
 */
function checkCompactorRouteDeviation(truckId, ward, actualBreadcrumbs) {
  const corridor = WARD_ROUTES[ward] || WARD_ROUTES["Ward G-North"];
  const stops = corridor.stops;

  const visitedStops = [];
  const missedStops = [];

  stops.forEach((stop) => {
    // Check if any breadcrumb was within 40 meters of the scheduled stop
    const wasVisited = actualBreadcrumbs.some((crumb) => {
      const dist = getDistanceMeters(stop.coordinates[1], stop.coordinates[0], crumb[1], crumb[0]);
      return dist <= 50;
    });

    if (wasVisited) {
      visitedStops.push(stop.name);
    } else {
      missedStops.push(stop.name);
    }
  });

  const completionRate = parseFloat(((visitedStops.length / stops.length) * 100).toFixed(1));
  const isDeviationFlagged = missedStops.length > 0;

  return {
    truckId,
    ward,
    corridorName: corridor.corridorName,
    totalPlannedStops: stops.length,
    visitedStopsCount: visitedStops.length,
    completionPercentage: completionRate,
    isDeviationFlagged,
    missedStops,
    status: isDeviationFlagged ? "ROUTE_DEVIATION_DETECTED" : "ON_SCHEDULE",
    auditAlert: isDeviationFlagged
      ? `⚠️ COMPACTOR DEVIATION: Truck ${truckId} skipped ${missedStops.join(", ")} in ${ward}.`
      : `✅ ROUTE COMPLIANT: Truck ${truckId} covered 100% of designated society bins.`,
  };
}

/**
 * Logs an RFID bin lift event from a compactor truck hydraulic arm
 */
async function processRfidLift({ rfidTag, truckId = "MH-01-CV-4081", grossWeightKg = 380 }) {
  let bin = await BinTelemetry.findOne({ rfidTag });
  if (!bin) {
    // Create new smart bin instance if first scan
    bin = new BinTelemetry({
      binId: `BIN-${rfidTag.slice(-4).toUpperCase()}`,
      rfidTag,
      ward: "Ward G-North",
      locality: "Dadar Shivaji Park North",
      currentFillPercentage: 0,
      status: "CLEANED",
      lastLiftTruckId: truckId,
      lastGrossWeightKg: Number(grossWeightKg),
      lastLiftedAt: new Date(),
      location: {
        type: "Point",
        coordinates: [72.8425, 19.0185],
      },
    });
  } else {
    bin.currentFillPercentage = 0; // Empty
    bin.status = "CLEANED";
    bin.lastLiftTruckId = truckId;
    bin.lastGrossWeightKg = Number(grossWeightKg);
    bin.lastLiftedAt = new Date();
  }

  await bin.save();

  return {
    binId: bin.binId,
    rfidTag: bin.rfidTag,
    ward: bin.ward,
    locality: bin.locality,
    grossWeightKg: bin.lastGrossWeightKg,
    status: "CLEANED",
    timestamp: bin.lastLiftedAt,
    message: `✅ RFID LIFT RECORDED: Bin ${bin.binId} lifted by Truck ${truckId}. Logged ${grossWeightKg}kg MSW. SLA cycle reset to CLEAN.`,
  };
}

module.exports = {
  WARD_ROUTES,
  getDistanceMeters,
  checkCompactorRouteDeviation,
  processRfidLift,
};
