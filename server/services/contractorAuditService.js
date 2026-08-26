/**
 * ─── Contractor 3-Strike Blacklisting & Escrow Penalty Engine ──────────────────
 * 100% MongoDB Persistence with Mongoose (ContractorScorecard)
 */

const ContractorScorecard = require("../models/ContractorScorecard");

class ContractorAuditService {
  /**
   * Evaluates strike count and enforces automated blacklisting / escrow freeze
   */
  evaluateContractorStatus(contractor) {
    if (contractor.strikesCount >= 3) {
      contractor.status = "BLACKLISTED_FROZEN";
      contractor.frozenEscrowInr = (contractor.frozenEscrowInr || 0) + (contractor.escrowBalanceInr || 0);
      contractor.escrowBalanceInr = 0;
      contractor.statutoryDebarmentOrder = {
        orderNumber: `BMC/DEBAR/${Date.now().toString().slice(-6)}`,
        issuedAt: new Date(),
        legalSection: "MMC Act Section 354 & Statutory Contractor Debarment Rules",
      };
      return {
        action: "DEBARMENT_EXECUTED",
        status: "BLACKLISTED_FROZEN",
        frozenAmount: contractor.frozenEscrowInr,
      };
    }

    if (contractor.strikesCount === 1 || contractor.strikesCount === 2) {
      contractor.status = "UNDER_PROBATION";
      return {
        action: "PROBATION_ISSUED",
        status: "UNDER_PROBATION",
      };
    }

    contractor.status = "ACTIVE_GOOD_STANDING";
    return {
      action: "GOOD_STANDING",
      status: "ACTIVE_GOOD_STANDING",
    };
  }

  /**
   * Fetches all contractor scorecards from MongoDB
   */
  async getAllContractors() {
    try {
      const scorecards = await ContractorScorecard.find().sort({ reliabilityScore: -1 }).lean();
      return scorecards;
    } catch {
      return [];
    }
  }

  /**
   * Issues a strike to a contractor in MongoDB and re-evaluates probation/debarment status
   */
  async issueStrike(contractorId, strikeData) {
    let contractor = await ContractorScorecard.findOne({ contractorId });
    if (!contractor) {
      contractor = await ContractorScorecard.create({
        contractorId,
        companyName: strikeData.companyName || "Municipal Contractor LLP",
        strikesCount: 0,
        escrowBalanceInr: 2500000,
        frozenEscrowInr: 0,
        reliabilityScore: 85,
        status: "ACTIVE_GOOD_STANDING",
      });
    }

    contractor.strikesCount = (contractor.strikesCount || 0) + 1;
    if (!contractor.strikeLogs) contractor.strikeLogs = [];

    contractor.strikeLogs.push({
      strikeNumber: contractor.strikesCount,
      complaintId: strikeData.complaintId || "SC-2026-AUTO",
      reason: strikeData.reason || "Citizen dispute upheld",
      upheldBy: strikeData.upheldBy || "Ward AMC",
      issuedAt: new Date(),
    });

    const evalResult = this.evaluateContractorStatus(contractor);
    await contractor.save();

    return {
      success: true,
      contractorId,
      strikesCount: contractor.strikesCount,
      ...evalResult,
    };
  }
}

module.exports = new ContractorAuditService();
