/**
 * ─── BMC Statutory SLA Escalation Cron Runner ─────────────────────────────────
 * Periodically evaluates unresolved complaints against 4-tier statutory timelines.
 */

const Complaint = require("../models/Complaint");
const slaHierarchyService = require("../services/slaHierarchyService");

async function runSlaEscalationScan() {
  try {
    const activeComplaints = await Complaint.find({
      status: { $in: ["submitted", "pending", "ai_verified", "assigned", "in_progress", "reopened"] },
    }).limit(100);

    let escalatedCount = 0;

    for (const c of activeComplaints) {
      const hierarchy = slaHierarchyService.getComplaintHierarchyStatus(c.createdAt);
      if (hierarchy.tierLevel >= 2 && c.priority !== "critical") {
        c.priority = "critical";
        c.escalationDetails = {
          tierLevel: hierarchy.tierLevel,
          officerTitle: hierarchy.officerTitle,
          slaBreachStatus: hierarchy.slaBreachStatus,
          lastEvaluatedAt: new Date(),
        };
        await c.save();
        escalatedCount++;
      }
    }

    return {
      success: true,
      scanned: activeComplaints.length,
      escalated: escalatedCount,
    };
  } catch (error) {
    console.error("SLA Escalation scan error:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  runSlaEscalationScan,
};
