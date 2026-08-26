/**
 * ─── Municipal SITREP Controller ──────────────────────────────────────────────
 */

const sitrepService = require("../services/sitrepService");

const getDailySitrep = async (req, res) => {
  try {
    const report = await sitrepService.generateDailySitrep();
    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate daily SITREP report." });
  }
};

module.exports = {
  getDailySitrep,
};
