/**
 * ─── ALM Society Governance Controller ─────────────────────────────────────────
 */

const almGovernanceService = require("../services/almGovernanceService");

const getSocieties = async (req, res) => {
  try {
    const societies = await almGovernanceService.getAllSocieties();
    return res.status(200).json({ success: true, count: societies.length, societies });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch societies." });
  }
};

const scheduleVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await almGovernanceService.scheduleCompactorVisit(id, req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to schedule visit." });
  }
};

module.exports = {
  getSocieties,
  scheduleVisit,
};
