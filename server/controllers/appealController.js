/**
 * ─── Citizen Appeal & Dispute Controller ───────────────────────────────────────
 */

const appealService = require("../services/appealService");

const submitAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const citizenId = req.user ? req.user._id : null;
    const result = await appealService.submitCitizenAppeal(id, citizenId, req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("SubmitAppeal error:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Failed to submit appeal." });
  }
};

const confirmResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const citizenId = req.user ? req.user._id : null;
    const result = await appealService.confirmResolution(id, citizenId, req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("ConfirmResolution error:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Failed to confirm resolution." });
  }
};

module.exports = {
  submitAppeal,
  confirmResolution,
};
