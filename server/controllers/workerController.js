const Complaint = require("../models/Complaint");
const workerTrackingService = require("../services/workerTrackingService");

const getLiveWorkerTracking = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const complaint = await Complaint.findOne({ ticketId }).populate("assignedWorker", "name phoneNumber email department");
    
    const complaintCoords = complaint?.location?.coordinates?.coordinates;
    const workerInfo = complaint?.assignedWorker ? {
      name: complaint.assignedWorker.name,
      phone: complaint.assignedWorker.phoneNumber || "",
      crewName: `${complaint.assignedWorker.department || "Municipal"} Field Response Crew`,
    } : null;

    const telemetry = workerTrackingService.getLiveWorkerTelemetry(ticketId, complaintCoords, workerInfo);
    return res.status(200).json({ success: true, data: telemetry });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch worker tracking telemetry." });
  }
};

module.exports = {
  getLiveWorkerTracking,
};

