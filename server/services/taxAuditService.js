"use strict";

const mongoose = require("mongoose");
const PropertyTaxAudit = require("../models/PropertyTaxAudit");

/**
 * ─── 3D Spatial Property Tax & Commercial Leakage AI Service ─────────────────────
 */

const DEFAULT_TAX_PROPERTIES = [
  {
    propertySacNo: "SAC-HW-99104",
    ward: "Ward H-West",
    ownerName: "Sunset Commercial Arcade Ltd",
    address: "Turner Road, Bandra West",
    assessedCarpetAreaSqFt: 1800,
    lidarMeasuredAreaSqFt: 2750,
    discrepancyPercentage: 52.8,
    permittedLandUse: "RESIDENTIAL",
    detectedActualUse: "COMMERCIAL_UNAUTHORIZED",
    hasRooftopExtension: true,
    estimatedTaxDeficitInr: 285000,
    penaltyAmountInr: 570000,
    status: "REVENUE_LEAKAGE_FLAGGED",
    coordinates: [72.8345, 19.0580],
  },
  {
    propertySacNo: "SAC-GN-40281",
    ward: "Ward G-North",
    ownerName: "Dadar Pearl Heights Society",
    address: "Ranade Road, Dadar West",
    assessedCarpetAreaSqFt: 1200,
    lidarMeasuredAreaSqFt: 1240,
    discrepancyPercentage: 3.3,
    permittedLandUse: "RESIDENTIAL",
    detectedActualUse: "RESIDENTIAL",
    hasRooftopExtension: false,
    estimatedTaxDeficitInr: 0,
    penaltyAmountInr: 0,
    status: "CLEAN_ASSESSMENT",
    coordinates: [72.8420, 19.0190],
  },
  {
    propertySacNo: "SAC-KW-71092",
    ward: "Ward K-West",
    ownerName: "Versova Bay Luxury Penthouse",
    address: "Yari Road, Versova, Andheri West",
    assessedCarpetAreaSqFt: 2200,
    lidarMeasuredAreaSqFt: 3100,
    discrepancyPercentage: 40.9,
    permittedLandUse: "RESIDENTIAL",
    detectedActualUse: "RESIDENTIAL",
    hasRooftopExtension: true,
    estimatedTaxDeficitInr: 162000,
    penaltyAmountInr: 324000,
    status: "DEMAND_NOTICE_SERVED",
    coordinates: [72.8150, 19.1360],
  },
];

/**
 * Calculates 3D LiDAR envelope discrepancy against declared carpet area, computing tax deficit + 200% penalty
 */
function calculatePropertyTaxDeficit({
  assessedCarpetAreaSqFt = 1200,
  lidarMeasuredAreaSqFt = 1650,
  permittedLandUse = "RESIDENTIAL",
  detectedActualUse = "COMMERCIAL_UNAUTHORIZED",
  hasRooftopExtension = false,
}) {
  const declared = Number(assessedCarpetAreaSqFt);
  const physical = Number(lidarMeasuredAreaSqFt);

  const areaDifference = Math.max(0, physical - declared);
  const discrepancyPercentage = declared > 0 ? parseFloat(((areaDifference / declared) * 100).toFixed(1)) : 0;

  const isAreaBreach = discrepancyPercentage > 15.0;
  const isUseBreach = permittedLandUse === "RESIDENTIAL" && detectedActualUse === "COMMERCIAL_UNAUTHORIZED";
  const isViolation = isAreaBreach || isUseBreach || hasRooftopExtension;

  // Rate baseline: ₹120 / sq ft residential base, ₹350 / sq ft commercial rate
  const ratePerSqFt = isUseBreach ? 350 : 120;
  const undeclaredAreaTax = Math.round(areaDifference * ratePerSqFt);
  const commercialConversionDelta = isUseBreach ? Math.round(declared * (350 - 120)) : 0;
  const rooftopDelta = hasRooftopExtension ? 65000 : 0;

  const estimatedTaxDeficitInr = isViolation ? undeclaredAreaTax + commercialConversionDelta + rooftopDelta : 0;
  const penaltyAmountInr = isViolation ? Math.round(estimatedTaxDeficitInr * 2.0) : 0; // 200% statutory penalty
  const totalRecoveryInr = estimatedTaxDeficitInr + penaltyAmountInr;

  return {
    assessedCarpetAreaSqFt: declared,
    lidarMeasuredAreaSqFt: physical,
    areaDifferenceSqFt: areaDifference,
    discrepancyPercentage,
    permittedLandUse,
    detectedActualUse,
    hasRooftopExtension: Boolean(hasRooftopExtension),
    isAreaBreached: isAreaBreach,
    isLandUseBreached: isUseBreach,
    isViolation,
    estimatedTaxDeficitInr,
    penaltyAmountInr,
    totalRecoveryInr,
    status: isViolation ? "REVENUE_LEAKAGE_FLAGGED" : "CLEAN_ASSESSMENT",
    assessmentNotice: isViolation
      ? `🚨 TAX LEAKAGE DETECTED: Physical area (${physical} sq ft) exceeds declared area by ${discrepancyPercentage}%. Total demand: ₹${totalRecoveryInr.toLocaleString()} (Deficit: ₹${estimatedTaxDeficitInr.toLocaleString()} + 200% Statutory Penalty: ₹${penaltyAmountInr.toLocaleString()}).`
      : `✅ CLEAN ASSESSMENT: Declared area matches 3D LiDAR envelope within 15% tolerance.`,
  };
}

module.exports = {
  DEFAULT_TAX_PROPERTIES,
  calculatePropertyTaxDeficit,
};
