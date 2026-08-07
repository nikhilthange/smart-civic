const Complaint = require("../models/Complaint");
const notificationService = require("./notificationService");

/**
 * Calculates dynamic SLA resolution deadline based on ticket priority:
 * - Critical: 12 Hours
 * - High:     24 Hours
 * - Medium:   48 Hours
 * - Low:      72 Hours
 */
const calculateSlaDeadline = (priority) => {
  const now = new Date();
  const hoursMap = {
    critical: 12,
    high:     24,
    medium:   48,
    low:      72,
  };
  const hours = hoursMap[priority] || 48;
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
};

/**
 * Automated Background Worker: Runs periodically to check for SLA breaches
 * and flags overdue complaints while applying contractor penalties.
 */
const checkSlaBreaches = async () => {
  try {
    const now = new Date();
    const activeStatuses = ["pending", "ai_verified", "assigned", "in_progress"];

    // Find all active complaints past SLA deadline that are not yet marked breached
    const overdueComplaints = await Complaint.find({
      status: { $in: activeStatuses },
      slaDeadline: { $lt: now },
      slaStatus: { $ne: "breached" },
    });

    if (overdueComplaints.length === 0) {
      return { breachedCount: 0 };
    }

    console.log(`⚠️ SLA Worker: Found ${overdueComplaints.length} overdue complaints past SLA deadline.`);

    let count = 0;
    for (const complaint of overdueComplaints) {
      complaint.slaStatus = "breached";
      // Apply ₹5,000 standard contractor breach penalty
      complaint.contractorPenalty = (complaint.contractorPenalty || 0) + 5000;

      complaint.statusHistory.push({
        status: complaint.status,
        note: `SLA Breached! Resolution deadline of ${new Date(complaint.slaDeadline).toLocaleString()} missed. ₹5,000 penalty assessed.`,
      });

      await complaint.save();
      count++;

      // Trigger escalation alert notification
      if (complaint.citizen) {
        await notificationService.statusUpdated(
          complaint.citizen,
          complaint,
          `SLA Escalated (Breached deadline)`
        );
      }
    }

    console.log(`✅ SLA Worker: Processed ${count} breached complaint escalations.`);
    return { breachedCount: count };
  } catch (error) {
    console.error("❌ SLA Check Error:", error.message);
    return { error: error.message };
  }
};

module.exports = {
  calculateSlaDeadline,
  checkSlaBreaches,
};
