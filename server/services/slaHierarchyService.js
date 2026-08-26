/**
 * ─── BMC Statutory 4-Tier Hierarchical SLA Escalation Service ────────────────
 * Computes statutory officer escalation levels based on elapsed ticket hours:
 *   - Tier 1 (0-24h): Junior Engineer (JE)
 *   - Tier 2 (24-48h): Executive Engineer (EE)
 *   - Tier 3 (48-72h): Assistant Municipal Commissioner (Ward AMC)
 *   - Tier 4 (>72h): Additional Municipal Commissioner (BMC HQ)
 */

class SlaHierarchyService {
  /**
   * Calculates escalation tier and officer authority based on hours elapsed
   */
  calculateEscalationTier(elapsedHours) {
    if (elapsedHours < 24) {
      return {
        tierLevel: 1,
        tierCode: "TIER_1_JE",
        officerTitle: "Junior Engineer (JE)",
        authorityLevel: "On-Site Ward Field Team",
        slaBreachStatus: "WITHIN_INITIAL_SLA",
        hoursRemainingInTier: Math.max(0, 24 - elapsedHours),
        statutoryRole: "Direct Task Execution & Contractor Supervision",
        actionRequired: "Field Dispatch & Defect Verification",
      };
    }

    if (elapsedHours >= 24 && elapsedHours < 48) {
      return {
        tierLevel: 2,
        tierCode: "TIER_2_EE",
        officerTitle: "Executive Engineer (EE)",
        authorityLevel: "Sub-Division Engineering Head",
        slaBreachStatus: "LEVEL_1_BREACH_ESCALATED",
        hoursRemainingInTier: Math.max(0, 48 - elapsedHours),
        statutoryRole: "Contractor Show-Cause & Material Re-allocation",
        actionRequired: "Emergency Contractor Reassignment",
      };
    }

    if (elapsedHours >= 48 && elapsedHours < 72) {
      return {
        tierLevel: 3,
        tierCode: "TIER_3_AMC",
        officerTitle: "Assistant Municipal Commissioner (Ward AMC)",
        authorityLevel: "Administrative Ward Chief",
        slaBreachStatus: "LEVEL_2_WARD_CRITICAL_BREACH",
        hoursRemainingInTier: Math.max(0, 72 - elapsedHours),
        statutoryRole: "Administrative Intervention & Fiscal Penalty Impound",
        actionRequired: "Contractor Escrow Forfeiture & Inter-Agency Summon",
      };
    }

    return {
      tierLevel: 4,
      tierCode: "TIER_4_MC_HQ",
      officerTitle: "Additional Municipal Commissioner (BMC HQ)",
      authorityLevel: "BMC Headquarters Standing Committee",
      slaBreachStatus: "LEVEL_3_STATUTORY_HQ_BREACH",
      hoursRemainingInTier: 0,
      statutoryRole: "Statutory Blacklisting & MMC Act Section 354 Hearing",
      actionRequired: "Contractor Blacklisting & Vigilance Audit Inquiry",
    };
  }

  /**
   * Computes statutory tier from complaint creation timestamp
   */
  getComplaintHierarchyStatus(createdAt) {
    const createdTime = new Date(createdAt).getTime();
    const now = Date.now();
    const elapsedHours = (now - createdTime) / (1000 * 60 * 60);

    return this.calculateEscalationTier(elapsedHours);
  }
}

module.exports = new SlaHierarchyService();
