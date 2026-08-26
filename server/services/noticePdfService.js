"use strict";

const crypto = require("crypto");

/**
 * ─── Statutory Municipal PDF Notice Generator Service ───────────────────────────
 * Formats formal legal orders under the Mumbai Municipal Corporation (MMC) Act 1888
 * with cryptographic SHA-256 digital seals and QR verification payloads.
 */

function generateStatutoryMunicipalNotice({
  noticeType = "SECTION_354_BUILDING_EVACUATION", // "SECTION_314_ENCROACHMENT", "DLP_WARRANTY_BREACH"
  recipientName = "Occupants & Owners of Siddharth Chawl Compound",
  ward = "Ward G-North",
  locationOrAddress = "Bhavani Shankar Road, Dadar West, Mumbai - 400028",
  statutoryGrounds = "Building categorised as C1 Dangerous Structure under MMC Act Section 354. Tilt sensor recorded 2.9° with acute structural collapse hazard.",
  allocatedTransitCamp = "Sion-Koliwada BMC Transit Tenements Block C",
  penaltyInr = 0,
}) {
  const noticeNo = `BMC/MMC/${noticeType.slice(0, 8)}/${ward.replace(/\s+/g, "").toUpperCase()}/${Date.now().toString().slice(-6)}`;
  const timestampIso = new Date().toISOString();
  const dateFormatted = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Generate cryptographic digital seal hash
  const sealPayload = `${noticeNo}|${noticeType}|${ward}|${recipientName}|${timestampIso}`;
  const sha256SealHash = crypto.createHash("sha256").update(sealPayload).digest("hex");

  const qrVerificationPayload = {
    noticeNo,
    verificationUrl: `https://portal.mcgm.gov.in/verify-notice/${noticeNo}`,
    sha256SealHash,
    issuedBy: "Office of the Municipal Commissioner, BMC",
    timestamp: timestampIso,
  };

  let headerTitle = "STATUTORY NOTICE UNDER SECTION 354 OF MMC ACT 1888";
  let actionClause = "VACATE AND EVACUATE PREMISES WITHIN 24 HOURS";

  if (noticeType === "SECTION_314_ENCROACHMENT") {
    headerTitle = "SUMMARY REMOVAL NOTICE UNDER SECTION 314 OF MMC ACT 1888";
    actionClause = "REMOVE ALL UNAUTHORIZED STALLS / STRUCTURES IMMEDIATELY";
  } else if (noticeType === "DLP_WARRANTY_BREACH") {
    headerTitle = "SHOW-CAUSE & ESCROW DEBIT ORDER UNDER ROAD DLP CLAUSE 18.4";
    actionClause = `DEBIT OF ₹${Number(penaltyInr).toLocaleString()} AND EMERGENCY RECTIFICATION`;
  }

  const legalNoticeText = `
═══════════════════════════════════════════════════════════════════════════════
                    BRIHANMUMBAI MUNICIPAL CORPORATION
               OFFICE OF THE ASSISTANT MUNICIPAL COMMISSIONER
═══════════════════════════════════════════════════════════════════════════════

${headerTitle}
NOTICE REFERENCE: ${noticeNo}
DATE OF ISSUANCE: ${dateFormatted}

TO:
${recipientName}
Location: ${locationOrAddress}
Administrative Ward: ${ward}

1. WHEREAS, inspection and structural/spatial sensor telemetry conducted under the authority of the Mumbai Municipal Corporation Act 1888 has confirmed the following critical condition:
   "${statutoryGrounds}"

2. AND WHEREAS, the competent municipal authority has determined that immediate executive intervention is required in the interest of public safety.

3. YOU ARE HEREBY ORDERED TO COMPLY WITH THE FOLLOWING DIRECTIVE:
   >>> ${actionClause} <<<
   ${allocatedTransitCamp ? `\n   Allocated Municipal Transit Facility: ${allocatedTransitCamp}` : ""}
   ${penaltyInr > 0 ? `\n   Statutory Fiscal Penalty: ₹${Number(penaltyInr).toLocaleString()}` : ""}

4. Take notice that in default of compliance, the Corporation shall execute eviction/demolition/rectification through Ward Enforcement Squads and Police Assistance without further notice, at your risk and costs.

DIGITALLY SIGNED & SEALED:
Office of the Assistant Commissioner (${ward})
Municipal Corporation of Greater Mumbai

[CRYPTOGRAPHIC SHA-256 DIGITAL SEAL]
${sha256SealHash}

[QR CODE VERIFICATION TARGET]
${qrVerificationPayload.verificationUrl}
═══════════════════════════════════════════════════════════════════════════════
`.trim();

  return {
    noticeNo,
    noticeType,
    ward,
    recipientName,
    locationOrAddress,
    dateFormatted,
    sha256SealHash,
    qrVerificationPayload,
    formattedNoticeText: legalNoticeText,
    isLegallyEnforceable: true,
  };
}

module.exports = {
  generateStatutoryMunicipalNotice,
};
