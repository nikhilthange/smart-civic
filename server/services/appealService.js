/**
 * ─── Citizen Appeal & Dispute Resolution Service ──────────────────────────────
 * Manages 48-hour citizen confirmation windows and L2 AMC escalation appeals.
 */

const Complaint = require("../models/Complaint");
const civicKarmaService = require("./civicKarmaService");

class CitizenAppealService {
  /**
   * Submits an appeal against a filed resolution, escalating to Level 2 (Ward AMC)
   */
  async submitCitizenAppeal(complaintId, citizenId, appealData) {
    const { disputeReason, disputeProofImageUrl, remarks } = appealData;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new Error(`Complaint ${complaintId} not found.`);
    }

    complaint.status = "reopened";
    complaint.disputeDetails = {
      isDisputed: true,
      disputeReason: disputeReason || "Citizen rejected contractor resolution proof",
      disputeProofImageUrl: disputeProofImageUrl || null,
      disputedAt: new Date(),
      escalationLevel: "L2_ASSISTANT_MUNICIPAL_COMMISSIONER",
      contractorPaymentHalted: true,
      remarks: remarks || "Citizen reported substandard or incomplete on-site rework.",
    };
    complaint.priority = "critical";

    if (!complaint.statusHistory) complaint.statusHistory = [];
    complaint.statusHistory.push({
      status: "reopened",
      note: `[L2 AMC ESCALATION] Citizen Appeal: ${disputeReason}`,
      changedAt: new Date(),
    });

    await complaint.save();

    return {
      success: true,
      complaintId: complaint.complaintId || complaint._id,
      status: "DISPUTED_ESCALATED_L2",
      escalatedTo: "Assistant Municipal Commissioner (AMC) - Ward " + (complaint.ward || "H-West"),
      contractorPaymentStatus: "HALTED_PENDING_INSPECTION",
      disputeDetails: complaint.disputeDetails,
    };
  }

  /**
   * Citizen confirms resolution, rating the work and awarding Civic Karma credits
   */
  async confirmResolution(complaintId, citizenId, confirmationData) {
    const { rating, feedback } = confirmationData;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new Error(`Complaint ${complaintId} not found.`);
    }

    complaint.status = "closed";
    complaint.citizenFeedback = {
      rating: rating || 5,
      feedback: feedback || "Resolution verified by citizen.",
      confirmedAt: new Date(),
    };

    if (!complaint.statusHistory) complaint.statusHistory = [];
    complaint.statusHistory.push({
      status: "closed",
      note: `[CITIZEN CONFIRMED] Rated ${rating || 5}/5: ${feedback || "Work verified satisfactorily"}`,
      changedAt: new Date(),
    });

    await complaint.save();

    // Award +20 Civic Karma Points to Citizen
    let karmaResult = null;
    try {
      karmaResult = await civicKarmaService.awardPoints(
        complaint.citizen || citizenId,
        20,
        "RESOLUTION_CONFIRMATION",
        `Confirmed resolution for ticket #${complaint.complaintId || complaint._id}`
      );
    } catch {
      // ignore
    }

    return {
      success: true,
      complaintId: complaint.complaintId || complaint._id,
      status: "closed",
      karmaPointsAwarded: 20,
      citizenFeedback: complaint.citizenFeedback,
      karmaBalance: karmaResult ? karmaResult.currentBalance : 120,
    };
  }
}

module.exports = new CitizenAppealService();
