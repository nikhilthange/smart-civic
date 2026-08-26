"use strict";

/**
 * ─── Municipal LLM Remediation Copilot Service ──────────────────────────────────
 */

/**
 * Generates statutory show-cause notice for DLP road warranty violations or contractor SLA breaches
 */
function generateShowCauseNotice({
  contractorName = "M/s Pratibha Infrastructure Pvt Ltd",
  roadOrProjectName = "Linking Road Bituminous Overlay (Chainage 0+000 to 1+450)",
  ward = "Ward H-West",
  violationType = "DLP_WARRANTY_BREACH",
  defectDescription = "Multiple surface craters and aggregate loss observed within 14 months of commissioning during active 36-month DLP.",
  penaltyAmountInr = 150000,
}) {
  const noticeNo = `BMC/CH.ENG/RDS/${ward.replace(/\s+/g, "").toUpperCase()}/${Date.now().toString().slice(-6)}`;
  const dateFormatted = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const legalNotice = `
BRIHANMUMBAI MUNICIPAL CORPORATION
Office of the Chief Engineer (Roads & Traffic)
Municipal Head Office, Annex Building, Fort, Mumbai - 400 001

SHOW-CAUSE NOTICE UNDER MUNICIPAL ROAD DLP CLAUSE 18.4
Notice No: ${noticeNo}
Date: ${dateFormatted}

To:
The Managing Director,
${contractorName},
Mumbai, Maharashtra.

SUBJECT: IMMEDIATE SHOW-CAUSE FOR ${violationType.replace(/_/g, " ")} — ${roadOrProjectName} (${ward})

Sir/Madam,

1. Whereas, your firm was awarded the civil contract for execution of the subject road works with a mandatory 36-Month Defect Liability Period (DLP) retention covenant.

2. On visual and 3D computer vision inspection conducted on ${dateFormatted}, the following severe non-compliance was recorded:
   "${defectDescription}"

3. As per Section 314 of the Mumbai Municipal Corporation (MMC) Act and Standard Contract Condition 44.2, you are hereby called upon to SHOW CAUSE within 48 HOURS of receipt of this notice as to why:
   (a) A statutory rectification penalty of ₹${Number(penaltyAmountInr).toLocaleString()} should not be debited from your active Escrow Retention Deposit.
   (b) The subject stretch should not be assigned to an empanelled emergency contractor at your sole risk, cost, and liability.
   (c) Your firm should not be blacklisted from participating in forthcoming BMC civil infrastructure tenders for a period of 2 years.

4. Failure to furnish an acceptable technical explanation and commence hot-mix repair mobilization within 48 hours shall result in immediate enforcement without further reference.

By Order of the Municipal Commissioner,
Chief Engineer (Roads & Traffic)
Brihanmumbai Municipal Corporation
`.trim();

  return {
    noticeNo,
    contractorName,
    ward,
    roadOrProjectName,
    violationType,
    penaltyAmountInr,
    formattedNoticeText: legalNotice,
    deliveryStatus: "TRANSMITTED_VIA_REGISTERED_PORTAL_AND_EMAIL",
    deadlineHours: 48,
  };
}

/**
 * Generates an Executive Ward Situation Summary for Ward Officers & Municipal Commissioners
 */
function generateWardSituationSummary({
  ward = "Ward G-North",
  activeGrievancesCount = 42,
  criticalPotholesCount = 6,
  c1BuildingsCount = 2,
  tideHeightMeters = 4.35,
  rainfallMmHr = 28,
}) {
  const dateFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const summary = `
🏛️ BMC EXECUTIVE WARD SITUATION REPORT — ${ward.toUpperCase()}
Generated on: ${dateFormatted} | Time: ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST

1. CRITICAL INFRASTRUCTURE STATUS:
   • C1 Dilapidated Buildings: ${c1BuildingsCount} structures under real-time micro-tiltmeter watch.
   • High-Tide & SWD Radar: Arabian Sea tide at ${tideHeightMeters}m (Rain: ${rainfallMmHr} mm/hr). Pumping station floodgates operational.
   • Road Defects: ${criticalPotholesCount} severe pothole clusters identified (3 covered under active contractor DLP).

2. CITIZEN GRIEVANCE METRICS:
   • Total Active Tickets: ${activeGrievancesCount}
   • Auto-Triaged: 62% PWD Roads • 24% SWM Solid Waste • 14% Water Supply
   • 3-Tier SLA Compliance Rate: 94.2% across Ward Field Crews.

3. RECOMMENDED EXECUTIVE INTERVENTIONS:
   • Dispatch mobile hot-mix crew to Dadar TT circle prior to evening peak hours.
   • Confirm evacuation transit passes for Siddharth Chawl (BLD-GN-01) residents.
   • Maintain standby diesel dewatering pumps at Hindmata low-lying chronic waterlogging bowl.
`.trim();

  return {
    ward,
    generatedAt: new Date().toISOString(),
    executiveSummary: summary,
    tideAlert: tideHeightMeters >= 4.5 ? "RED_HIGH_TIDE_WARNING" : "NORMAL_TIDAL_FLOW",
    actionItemsCount: 3,
  };
}

module.exports = {
  generateShowCauseNotice,
  generateWardSituationSummary,
};
