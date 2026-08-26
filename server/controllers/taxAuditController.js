"use strict";

const asyncHandler = require("express-async-handler");
const PropertyTaxAudit = require("../models/PropertyTaxAudit");
const {
  DEFAULT_TAX_PROPERTIES,
  calculatePropertyTaxDeficit,
} = require("../services/taxAuditService");

/**
 * @route   GET /api/tax-audit/discrepancies
 * @desc    Get all 3D LiDAR property tax discrepancies and revenue leakage records
 * @access  Public / Authenticated
 */
exports.getTaxDiscrepancies = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  let properties = await PropertyTaxAudit.find(filter).sort({ estimatedTaxDeficitInr: -1 });

  if (properties.length === 0) {
    properties = DEFAULT_TAX_PROPERTIES.filter((p) => !ward || ward === "all" || p.ward === ward);
  }

  res.status(200).json({
    success: true,
    count: properties.length,
    properties,
  });
});

/**
 * @route   POST /api/tax-audit/reconcile
 * @desc    Reconciles assessed carpet area vs LiDAR envelope and generates demand notices
 * @access  Public / Authenticated
 */
exports.reconcilePropertyTax = asyncHandler(async (req, res) => {
  const {
    propertySacNo = "SAC-HW-99104",
    assessedCarpetAreaSqFt = 1800,
    lidarMeasuredAreaSqFt = 2750,
    permittedLandUse = "RESIDENTIAL",
    detectedActualUse = "COMMERCIAL_UNAUTHORIZED",
    hasRooftopExtension = true,
  } = req.body;

  const result = calculatePropertyTaxDeficit({
    assessedCarpetAreaSqFt: Number(assessedCarpetAreaSqFt),
    lidarMeasuredAreaSqFt: Number(lidarMeasuredAreaSqFt),
    permittedLandUse,
    detectedActualUse,
    hasRooftopExtension: Boolean(hasRooftopExtension),
  });

  res.status(200).json({
    success: true,
    propertySacNo,
    ...result,
  });
});
