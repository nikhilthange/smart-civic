"use strict";

const asyncHandler = require("express-async-handler");
const PropertyTaxAudit = require("../models/PropertyTaxAudit");
const { calculatePropertyTaxDeficit } = require("../services/taxAuditService");
const { invalidateCache } = require("../middlewares/cacheMiddleware");

/**
 * @route   GET /api/tax-audit/discrepancies
 * @desc    Get all 3D LiDAR property tax discrepancies and revenue leakage records
 * @access  Public / Authenticated
 */
exports.getTaxDiscrepancies = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const filter = ward && ward !== "all" ? { ward } : {};
  const properties = await PropertyTaxAudit.find(filter).sort({ estimatedTaxDeficitInr: -1 }).lean();

  res.status(200).json({
    success: true,
    count: properties.length,
    properties,
  });
});

/**
 * @route   POST /api/tax-audit/discrepancies
 * @desc    Register a new property tax audit discrepancy record in MongoDB
 * @access  Protected (Admin, Officer)
 */
exports.createTaxProperty = asyncHandler(async (req, res) => {
  const {
    propertySacNo = `SAC-${Date.now().toString().slice(-6)}`,
    ownerName,
    ward,
    address,
    assessedCarpetAreaSqFt = 1800,
    lidarMeasuredAreaSqFt = 2500,
    permittedLandUse = "RESIDENTIAL",
    detectedActualUse = "COMMERCIAL_UNAUTHORIZED",
    hasRooftopExtension = true,
    coordinates,
  } = req.body;

  if (!ownerName || typeof ownerName !== "string" || !ownerName.trim()) {
    return res.status(400).json({ success: false, message: "Valid ownerName string is required" });
  }

  if (!ward || typeof ward !== "string" || !ward.trim()) {
    return res.status(400).json({ success: false, message: "Valid ward string is required" });
  }

  if (coordinates && (!Array.isArray(coordinates) || coordinates.length !== 2 || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number")) {
    return res.status(400).json({ success: false, message: "Coordinates must be an array of two numbers [lng, lat]" });
  }

  try {
    const coords = Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [72.8250, 19.0520];
    const assessed = Math.max(10, Number(assessedCarpetAreaSqFt) || 1800);
    const measured = Math.max(10, Number(lidarMeasuredAreaSqFt) || 2500);

    const deficit = calculatePropertyTaxDeficit({
      assessedCarpetAreaSqFt: assessed,
      lidarMeasuredAreaSqFt: measured,
      permittedLandUse,
      detectedActualUse,
      hasRooftopExtension: Boolean(hasRooftopExtension),
    });

    const property = await PropertyTaxAudit.create({
      propertySacNo: String(propertySacNo).trim(),
      ownerName: ownerName.trim(),
      ward: ward.trim(),
      address: address ? String(address).trim() : "Ward Property Zone",
      assessedCarpetAreaSqFt: assessed,
      lidarMeasuredAreaSqFt: measured,
      permittedLandUse,
      detectedActualUse,
      hasRooftopExtension: Boolean(hasRooftopExtension),
      unauthorizedAreaSqFt: deficit.unauthorizedAreaSqFt,
      estimatedTaxDeficitInr: deficit.estimatedTaxDeficitInr,
      penaltyInr: deficit.penaltyInr,
      auditStatus: deficit.actionRequired === "ISSUE_DEMAND_NOTICE" ? "DEMAND_NOTICE_SERVED" : "FLAGGED_DISCREPANCY",
      demandNoticeServed: deficit.actionRequired === "ISSUE_DEMAND_NOTICE",
      location: {
        type: "Point",
        coordinates: coords,
      },
    });

    invalidateCache(["tax-audit:", "sitrep:", "/api/sitrep"]);

    return res.status(201).json({
      success: true,
      message: `Property Tax Audit SAC "${property.propertySacNo}" registered successfully`,
      property,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Failed to create property tax audit record" });
  }
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
