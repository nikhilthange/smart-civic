/**
 * ─── Emergency Broadcast Controller ───────────────────────────────────────────
 */

const broadcastService = require("../services/broadcastService");

const getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await broadcastService.getRecentBroadcasts();
    return res.status(200).json({ success: true, count: broadcasts.length, broadcasts });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch emergency broadcasts." });
  }
};

const sendBroadcast = async (req, res) => {
  try {
    const result = await broadcastService.dispatchEmergencyBroadcast(req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to dispatch broadcast." });
  }
};

module.exports = {
  getBroadcasts,
  sendBroadcast,
};
