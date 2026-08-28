const Complaint = require("../models/Complaint");
const Contractor = require("../models/Contractor");
const notificationService = require("./notificationService");
const socketService = require("./socketService");

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
 * and processes Hierarchical 3-Tier SLA Escalations:
 * - Tier 1: Initial SLA breach (>0h) -> ₹5,000 contractor penalty
 * - Tier 2: Assistant Municipal Commissioner Alert (>6h overdue) -> ₹2,500 extra penalty
 * - Tier 3: Municipal Commissioner Red Flag (>12h overdue) -> ₹5,000 extra penalty + Critical Broadcast
 */
const checkSlaBreaches = async () => {
  try {
    const now = new Date();
    const activeStatuses = ["pending", "submitted", "ai_verified", "ward_assigned", "officer_assigned", "worker_assigned", "assigned", "in_progress"];

    // 1. Check Initial Breaches (Tier 1)
    const overdueComplaints = await Complaint.find({
      status: { $in: activeStatuses },
      slaDeadline: { $lt: now },
      slaStatus: { $ne: "breached" },
    });

    let count = 0;

    for (const complaint of overdueComplaints) {
      complaint.slaStatus = "breached";
      complaint.isEscalated = true;
      complaint.escalationTier = 1;
      complaint.priority = "critical";
      complaint.escalatedAt = now;
      complaint.contractorPenalty = (complaint.contractorPenalty || 0) + 5000;

      let penaltyNote = "";
      if (complaint.contractor) {
        try {
          const Contractor = require("../models/Contractor");
          const contractorDoc = await Contractor.findOneAndUpdate(
            { _id: complaint.contractor, escrowBalance: { $gte: 5000 } },
            {
              $inc: { escrowBalance: -5000, accumulatedPenalties: 5000, slaBreaches: 1 }
            },
            { returnDocument: "after" }
          );
          if (contractorDoc) {
            penaltyNote = ` Deducted ₹5,000 from contractor (${contractorDoc.name}) escrow deposit.`;
          } else {
            console.warn(`⚠️ [ESCROW_DEFICIT] Contractor balance insufficient for tier 1 penalty (Contractor: ${complaint.contractor}, Penalty: ₹5,000)`);
            await Contractor.findByIdAndUpdate(complaint.contractor, {
              $inc: { uncollectedPenalties: 5000, accumulatedPenalties: 5000, slaBreaches: 1 }
            });
            penaltyNote = ` ₹5,000 penalty logged under outstanding contractor deficit ledger.`;
          }
        } catch (cErr) {
          console.warn("Contractor SLA penalty update warning:", cErr.message);
        }
      }

      complaint.statusHistory.push({
        status: complaint.status,
        note: `Tier 1 SLA Breach: Resolution deadline of ${new Date(complaint.slaDeadline).toLocaleString()} missed. ₹5,000 penalty assessed.${penaltyNote}`,
      });

      await complaint.save();
      count++;

      // Dispatch ward-level real-time escalation broadcast
      try {
        if (socketService.broadcastHotspotAlert) {
          socketService.broadcastHotspotAlert({
            ward: complaint.ward || "Ward A",
            lat: complaint.location?.coordinates?.coordinates?.[1] || 19.0760,
            lng: complaint.location?.coordinates?.coordinates?.[0] || 72.8777,
            count: 1,
            message: `⚠️ Tier 1 SLA Breach: Ticket ${complaint.complaintId || complaint._id} breached resolution deadline in ${complaint.ward || "Ward"}!`,
          });
        }
      } catch (wsErr) {
        console.warn("SLA breach ward broadcast warning:", wsErr.message);
      }

      if (complaint.citizen) {
        try {
          if (typeof notificationService.statusUpdated === 'function') {
            await notificationService.statusUpdated(
              complaint.citizen,
              complaint,
              `SLA Breached (Tier 1 Escalation)`
            );
          } else if (typeof notificationService.notifyStatusUpdate === 'function') {
            await notificationService.notifyStatusUpdate(complaint);
          } else if (typeof notificationService.send === 'function') {
            await notificationService.send({
              recipientId: complaint.citizen,
              complaintId: complaint._id,
              type: "complaint_status_update",
              title: "SLA Breached (Tier 1 Escalation) ⚠️",
              message: `Your complaint "${complaint.title}" has exceeded SLA resolution deadline. Penalty has been assessed.`,
              actionUrl: `/complaint/${complaint._id}/track`,
            });
          }
        } catch (notifErr) {
          console.warn("SLA notification warning:", notifErr.message);
        }
      }
    }

    // 2. Check Tier 2 Escalations (>6 Hours Breached & Tier === 1)
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const tier2Candidates = await Complaint.find({
      status: { $in: activeStatuses },
      slaStatus: "breached",
      escalationTier: 1,
      slaDeadline: { $lt: sixHoursAgo },
    });

    for (const complaint of tier2Candidates) {
      complaint.escalationTier = 2;
      complaint.isEscalated = true;
      complaint.escalatedAt = now;
      complaint.contractorPenalty = (complaint.contractorPenalty || 0) + 2500;

      if (complaint.contractor) {
        try {
          const Contractor = require("../models/Contractor");
          const contractorDoc = await Contractor.findOneAndUpdate(
            { _id: complaint.contractor, escrowBalance: { $gte: 2500 } },
            {
              $inc: { escrowBalance: -2500, accumulatedPenalties: 2500 }
            },
            { returnDocument: "after" }
          );
          if (!contractorDoc) {
            console.warn(`⚠️ [ESCROW_DEFICIT] Contractor balance insufficient for tier 2 penalty (Contractor: ${complaint.contractor}, Penalty: ₹2,500)`);
            await Contractor.findByIdAndUpdate(complaint.contractor, {
              $inc: { uncollectedPenalties: 2500, accumulatedPenalties: 2500 }
            });
          }
        } catch (cErr) {
          console.warn("Contractor Tier 2 penalty update warning:", cErr.message);
        }
      }

      complaint.statusHistory.push({
        status: complaint.status,
        note: `🚨 Tier 2 Escalation (Assistant Municipal Commissioner Alert): Overdue >6 hours. Extra ₹2,500 contractor penalty applied.`,
      });

      await complaint.save();
      count++;
    }

    // 3. Check Tier 3 Escalations (>12 Hours Breached & Tier === 2)
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const tier3Candidates = await Complaint.find({
      status: { $in: activeStatuses },
      slaStatus: "breached",
      escalationTier: 2,
      slaDeadline: { $lt: twelveHoursAgo },
    });

    for (const complaint of tier3Candidates) {
      complaint.escalationTier = 3;
      complaint.isEscalated = true;
      complaint.escalatedAt = now;
      complaint.contractorPenalty = (complaint.contractorPenalty || 0) + 5000;

      if (complaint.contractor) {
        try {
          const Contractor = require("../models/Contractor");
          const contractorDoc = await Contractor.findOneAndUpdate(
            { _id: complaint.contractor, escrowBalance: { $gte: 5000 } },
            {
              $inc: { escrowBalance: -5000, accumulatedPenalties: 5000 }
            },
            { returnDocument: "after" }
          );
          if (!contractorDoc) {
            console.warn(`⚠️ [ESCROW_DEFICIT] Contractor balance insufficient for tier 3 penalty (Contractor: ${complaint.contractor}, Penalty: ₹5,000)`);
            await Contractor.findByIdAndUpdate(complaint.contractor, {
              $inc: { uncollectedPenalties: 5000, accumulatedPenalties: 5000 }
            });
          }
        } catch (cErr) {
          console.warn("Contractor Tier 3 penalty update warning:", cErr.message);
        }
      }

      complaint.statusHistory.push({
        status: complaint.status,
        note: `🔥 Tier 3 Escalation (Municipal Commissioner Red Flag): Overdue >12 hours. Severe ₹5,000 contractor penalty applied.`,
      });

      await complaint.save();

      // Broadcast Critical Escalation
      try {
        socketService.broadcastHotspotAlert({
          ward: complaint.ward || "Ward A",
          lat: complaint.location?.coordinates?.coordinates?.[1] || 19.0760,
          lng: complaint.location?.coordinates?.coordinates?.[0] || 72.8777,
          count: 1,
          message: `CRITICAL TIER 3 ESCALATION: Ticket ${complaint.complaintId || complaint._id} is >12h overdue in ${complaint.ward}!`,
        });
      } catch (sErr) {
        console.warn("Escalation broadcast error:", sErr.message);
      }

      count++;
    }

    if (count > 0) {
      console.log(`✅ SLA Worker: Processed ${count} SLA breach & hierarchical escalations.`);
    }
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
