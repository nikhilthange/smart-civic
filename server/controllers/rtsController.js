"use strict";

const rtsService = require("../services/rtsService");

/**
 * ─── RTS Statutory Guarantee Controller ──────────────────────────────────────
 */

// GET /api/rts/status/:complaintId
exports.getComplaintRtsStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const rtsData = await rtsService.getComplaintRtsStatus(complaintId);
    return res.status(200).json({ success: true, rts: rtsData });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message || "Failed to retrieve RTS guarantee." });
  }
};

// GET /api/rts/stats
exports.getMunicipalRtsStats = async (req, res) => {
  try {
    const stats = await rtsService.getMunicipalRtsScorecard();
    return res.status(200).json(stats);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to retrieve RTS statistics." });
  }
};
