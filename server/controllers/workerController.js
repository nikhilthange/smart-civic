/**
 * ─── Worker Dispatch & Telemetry Controller ────────────────────────────────────
 */

const workerTrackingService = require("../services/workerTrackingService");

const getLiveWorkerTracking = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const telemetry = workerTrackingService.getLiveWorkerTelemetry(ticketId);
    return res.status(200).json({ success: true, data: telemetry });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch worker tracking telemetry." });
  }
};

module.exports = {
  getLiveWorkerTracking,
};
