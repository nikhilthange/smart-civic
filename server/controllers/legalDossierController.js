"use strict";

const legalDossierService = require("../services/legalDossierService");

/**
 * ─── @desc    Get Court-Admissible Electronic Evidentiary Dossier (Sec 65B & RTI)
 * ─── @route   GET /api/legal-dossier/complaint/:complaintId
 * ─── @access  Public / Authenticated
 */
exports.getComplaintDossier = async (req, res) => {
  try {
    const { complaintId } = req.params;
    if (!complaintId) {
      return res.status(400).json({ success: false, message: "Complaint ID parameter is required." });
    }

    const dossier = await legalDossierService.generateEvidentiaryDossier(complaintId);
    return res.status(200).json(dossier);
  } catch (error) {
    console.error("Legal Dossier Generation Error:", error.message);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * ─── @desc    Execute Autonomous Emergency Re-Tendering & Collateral Forfeiture
 * ─── @route   POST /api/legal-dossier/emergency-retender/:complaintId
 * ─── @access  Private (Officer, Admin)
 */
exports.executeEmergencyRetender = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const authorizingOfficer = req.user?.name || req.body?.authorizingOfficer || "Ward Assistant Municipal Commissioner";

    const result = await legalDossierService.executeEmergencyRetender({
      complaintId,
      authorizingOfficer,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Emergency Re-Tendering Error:", error.message);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * ─── @desc    Get Ward-Wide Systemic Delinquency Dossier for High Court PIL
 * ─── @route   GET /api/legal-dossier/ward/:ward
 * ─── @access  Public / Authenticated
 */
exports.getWardSystemicDossier = async (req, res) => {
  try {
    const { ward } = req.params;
    const dossier = await legalDossierService.generateWardSystemicDossier(ward);
    return res.status(200).json(dossier);
  } catch (error) {
    console.error("Ward Systemic Dossier Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
