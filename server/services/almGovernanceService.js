/**
 * ─── ALM & Cooperative Housing Society (CHS) Governance Service ───────────────
 * 100% MongoDB Persistence with Mongoose (HousingSociety)
 */

const HousingSociety = require("../models/HousingSociety");

class AlmGovernanceService {
  /**
   * Calculates property tax rebate eligibility (>=85% segregation & compost pit)
   */
  calculateTaxRebateEligibility(segregationScorePct, hasCompostPit) {
    const isEligible = segregationScorePct >= 85 && hasCompostPit;
    return {
      isEligible,
      rebatePercentage: isEligible ? 5 : 0,
      qualificationStatus: isEligible ? "QUALIFIED_5_PERCENT_REBATE" : "PENDING_IMPROVEMENT",
      improvementAdvice: !hasCompostPit
        ? "Install an on-site organic composting pit to qualify for 5% tax rebate."
        : segregationScorePct < 85
        ? `Improve wet/dry waste segregation from ${segregationScorePct}% to >=85% to qualify.`
        : "Compliant with all BMC Swachh Mumbai circular standards.",
    };
  }

  /**
   * Retrieves all registered housing societies from MongoDB
   */
  async getAllSocieties() {
    try {
      const societies = await HousingSociety.find().sort({ segregationScorePct: -1 }).lean();
      return societies;
    } catch {
      return [];
    }
  }

  /**
   * Schedules a priority SWM mechanical compactor visit in MongoDB
   */
  async scheduleCompactorVisit(societyId, scheduleData) {
    const society = await HousingSociety.findOneAndUpdate(
      { societyId },
      {
        $set: {
          compactorVisitSchedule: {
            dayOfWeek: scheduleData.dayOfWeek || "DAILY_PRIORITY",
            timeSlot: scheduleData.timeSlot || "07:30 AM - 09:00 AM",
          },
        },
      },
      { new: true, upsert: true }
    );

    return {
      success: true,
      societyId,
      updatedSchedule: society.compactorVisitSchedule,
    };
  }
}

module.exports = new AlmGovernanceService();
