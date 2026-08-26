/**
 * ─── Contractor Scorecard Controller ──────────────────────────────────────────
 */

const contractorAuditService = require("../services/contractorAuditService");

const getContractors = async (req, res) => {
  try {
    const contractors = await contractorAuditService.getAllContractors();
    return res.status(200).json({ success: true, count: contractors.length, contractors });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch contractors." });
  }
};

const issueStrike = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await contractorAuditService.issueStrike(id, req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to issue strike." });
  }
};

module.exports = {
  getContractors,
  issueStrike,
};
