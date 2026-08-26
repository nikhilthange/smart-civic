const mongoose = require("mongoose");
const HawkingZone = require("../models/HawkingZone");
const { getDistanceMeters } = require("./swmFleetService");

/**
 * ─── Encroachment & No-Hawking Zone GIS Service ──────────────────────────────────
 */

// Default Prescribed BMC Statutory No-Hawking Zones (150m from Railway Stations / Hospitals)
const DEFAULT_NO_HAWKING_ZONES = [
  {
    zoneId: "NHZ-GN-01",
    zoneName: "Dadar Railway Station West (150m Perimeter)",
    ward: "Ward G-North",
    zoneType: "NON_HAWKING_ZONE",
    restrictionReason: "150m Statutory High-Density Pedestrian Station Buffer",
    coordinates: [72.8437, 19.0178],
    prohibitedRadiusMeters: 150,
  },
  {
    zoneId: "NHZ-HW-02",
    zoneName: "Bandra Railway Station West Entrance & Hill Rd Start",
    ward: "Ward H-West",
    zoneType: "NON_HAWKING_ZONE",
    restrictionReason: "150m Suburban Terminal Evacuation Corridor",
    coordinates: [72.8405, 19.0550],
    prohibitedRadiusMeters: 150,
  },
  {
    zoneId: "NHZ-KW-03",
    zoneName: "Andheri Station West S.V. Road Junction",
    ward: "Ward K-West",
    zoneType: "NON_HAWKING_ZONE",
    restrictionReason: "150m Metro-Rail Transit Interchange Zone",
    coordinates: [72.8436, 19.1197],
    prohibitedRadiusMeters: 150,
  },
  {
    zoneId: "NHZ-GS-04",
    zoneName: "KEM & Tata Memorial Hospital Perimeter",
    ward: "Ward G-South",
    zoneType: "NON_HAWKING_ZONE",
    restrictionReason: "Emergency Ambulance Passage Zone",
    coordinates: [72.8410, 19.0035],
    prohibitedRadiusMeters: 150,
  },
];

/**
 * Checks if a coordinate falls in a designated Non-Hawking Zone
 * @param {Array} coordinates - [longitude, latitude]
 * @param {string} ward - Ward name
 */
async function checkNonHawkingZoneViolation(coordinates, ward) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
    return { isNoHawkingViolation: false, matchedZone: null };
  }

  const [lng, lat] = coordinates;

  // 1. Check MongoDB zones if connected and populated
  let dbMatch = null;
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      dbMatch = await HawkingZone.findOne({
        zoneType: "NON_HAWKING_ZONE",
        geometry: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: 150,
          },
        },
      });
    } catch {
      // fallback to static
    }
  }

  if (dbMatch) {
    return {
      isNoHawkingViolation: true,
      zoneId: dbMatch.zoneId,
      zoneName: dbMatch.zoneName,
      ward: dbMatch.ward,
      priority: "CRITICAL_ENCROACHMENT",
      action: "DISPATCH_LICENSE_INSPECTOR_AND_POLICE",
      message: `🚨 HIGH PRIORITY: Unauthorized stall reported in statutory Non-Hawking Zone (${dbMatch.zoneName}). Auto-routed to Ward License Dept.`,
    };
  }

  // 2. Check Static BMC High-Security Zones fallback
  for (const zone of DEFAULT_NO_HAWKING_ZONES) {
    const dist = getDistanceMeters(lat, lng, zone.coordinates[1], zone.coordinates[0]);
    if (dist <= zone.prohibitedRadiusMeters) {
      return {
        isNoHawkingViolation: true,
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        ward: zone.ward,
        distanceFromZoneCenterMeters: dist,
        priority: "CRITICAL_ENCROACHMENT",
        action: "DISPATCH_LICENSE_INSPECTOR_AND_POLICE",
        message: `🚨 HIGH PRIORITY: Incident is ${dist}m inside statutory Non-Hawking Zone (${zone.zoneName}). Evacuation corridor clear-order issued.`,
      };
    }
  }

  return {
    isNoHawkingViolation: false,
    priority: "STANDARD_ENCROACHMENT",
    action: "ROUTED_TO_WARD_SQUAD",
    message: "Grievance located outside statutory 150m no-hawking station buffer.",
  };
}

module.exports = {
  DEFAULT_NO_HAWKING_ZONES,
  checkNonHawkingZoneViolation,
};
