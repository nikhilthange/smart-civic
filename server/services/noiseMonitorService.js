"use strict";

const mongoose = require("mongoose");
const CommercialTurf = require("../models/CommercialTurf");

/**
 * ─── Nighttime Turf Noise & Light Pollution Monitor Service ──────────────────────
 */

/**
 * Evaluates decibel and lux levels against statutory 22:00 curfew & 55 dBA nighttime limit
 */
async function auditTurfViolation({
  venueId,
  decibelsDba = 68,
  luxLevel = 340,
  timestamp = new Date(),
}) {
  const dateObj = new Date(timestamp);
  const hour = dateObj.getHours(); // 0 - 23
  const isPastCurfew = hour >= 22 || hour < 6; // 22:00 to 06:00
  const dba = Number(decibelsDba);
  const lux = Number(luxLevel);

  const isNoiseBreached = dba > 55; // 55 dBA statutory limit
  const isSevereNoise = dba > 65;
  const isLightBreached = isPastCurfew && lux > 250;

  const isViolation = isPastCurfew && (isNoiseBreached || isLightBreached);

  let updatedStatus = "ACTIVE";
  let actionTaken = "LOGGED_NORMAL";

  if (isViolation) {
    updatedStatus = isSevereNoise ? "SUSPENDED" : "UNDER_INSPECTION";
    actionTaken = "ESCALATED_TO_SENIOR_POLICE_INSPECTOR_AND_LICENSE_DEPT";
  }

  if (mongoose.connection && mongoose.connection.readyState === 1 && venueId) {
    try {
      const venue = await CommercialTurf.findOne({ venueId });
      if (venue) {
        venue.lastRecordedDecibels = dba;
        venue.lastRecordedLux = lux;
        if (isViolation) {
          venue.totalViolationsCount += 1;
          venue.operatingLicenseStatus = updatedStatus;
        }
        await venue.save();
      }
    } catch {
      // continue
    }
  }

  return {
    venueId,
    timestamp: dateObj.toISOString(),
    recordedHour: hour,
    isPastCurfew,
    decibelsDba: dba,
    luxLevel: lux,
    isViolation,
    operatingLicenseStatus: updatedStatus,
    actionTaken,
    enforcementNotice: isViolation
      ? `🚨 NOISE & LIGHT CURFEW BREACH: ${dba} dBA recorded at ${hour}:00 IST (Max allowed: 55 dBA past 22:00). Escalated to Ward Senior Police Inspector for immediate shutdown.`
      : `✅ COMPLIANT: Acoustic & illumination levels within residential buffer norms.`,
  };
}

module.exports = {
  auditTurfViolation,
};
