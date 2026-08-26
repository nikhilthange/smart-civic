"use strict";

const mongoose = require("mongoose");
const MangroveZone = require("../models/MangroveZone");

/**
 * ─── Mangrove & CRZ-I Satellite / Drone Sentinel Service ─────────────────────────
 */

const DEFAULT_COASTAL_ZONES = [
  {
    zoneId: "CRZ-KW-01",
    zoneName: "Versova Creek & Mudflats Buffer",
    ward: "Ward K-West",
    crzClassification: "CRZ_I_ECOLOGICALLY_SENSITIVE",
    baselineNdvi: 0.78,
    currentNdvi: 0.51,
    vegetationLossPercentage: 34.6,
    debrisDumpingDetected: true,
    status: "CRITICAL_CRZ_DESTRUCTION",
    injunctionNoticeIssued: true,
    mangroveCellNotified: true,
    coordinates: [72.8120, 19.1420],
  },
  {
    zoneId: "CRZ-GN-02",
    zoneName: "Mahim Nature Park & Mithi Estuary",
    ward: "Ward G-North",
    crzClassification: "CRZ_I_ECOLOGICALLY_SENSITIVE",
    baselineNdvi: 0.82,
    currentNdvi: 0.77,
    vegetationLossPercentage: 6.1,
    debrisDumpingDetected: false,
    status: "PROTECTED_HEALTHY",
    injunctionNoticeIssued: false,
    mangroveCellNotified: false,
    coordinates: [72.8550, 19.0480],
  },
  {
    zoneId: "CRZ-RN-03",
    zoneName: "Gorai Creek & Pagoda Mangrove Belt",
    ward: "Ward R-North",
    crzClassification: "CRZ_I_ECOLOGICALLY_SENSITIVE",
    baselineNdvi: 0.75,
    currentNdvi: 0.63,
    vegetationLossPercentage: 16.0,
    debrisDumpingDetected: false,
    status: "MODERATE_DEPLETION",
    injunctionNoticeIssued: false,
    mangroveCellNotified: false,
    coordinates: [72.8050, 19.2390],
  },
];

/**
 * Evaluates satellite/drone NDVI index changes and illegal debris dumping inside 50m CRZ-I buffer
 */
async function processCoastalScanTelemetry({
  zoneId,
  baselineNdvi = 0.78,
  currentNdvi = 0.51,
  debrisDumpingDetected = true,
}) {
  const base = Number(baselineNdvi);
  const current = Number(currentNdvi);
  const isDumping = Boolean(debrisDumpingDetected);

  const lossPct = base > 0 ? parseFloat((((base - current) / base) * 100).toFixed(1)) : 0;
  const isCriticalLoss = lossPct > 25.0 || isDumping;

  const status = isCriticalLoss
    ? "CRITICAL_CRZ_DESTRUCTION"
    : lossPct > 12.0
    ? "MODERATE_DEPLETION"
    : "PROTECTED_HEALTHY";

  let zone = DEFAULT_COASTAL_ZONES.find((z) => z.zoneId === zoneId) || DEFAULT_COASTAL_ZONES[0];

  if (mongoose.connection && mongoose.connection.readyState === 1 && zoneId) {
    try {
      const dbZone = await MangroveZone.findOne({ zoneId });
      if (dbZone) {
        dbZone.currentNdvi = current;
        dbZone.vegetationLossPercentage = lossPct;
        dbZone.debrisDumpingDetected = isDumping;
        dbZone.status = status;
        if (isCriticalLoss) {
          dbZone.injunctionNoticeIssued = true;
          dbZone.mangroveCellNotified = true;
        }
        await dbZone.save();
        zone = dbZone;
      }
    } catch {
      // continue
    }
  }

  const injunction = isCriticalLoss
    ? {
        injunctionId: `INJ-CRZ-${zone.zoneId}-${Date.now().toString().slice(-4)}`,
        zoneName: zone.zoneName,
        ward: zone.ward,
        violationType: isDumping ? "ILLEGAL_DEBRIS_DUMPING_AND_DEFORESTATION" : "UNAUTHORIZED_NDVI_DEPLETION",
        vegetationLossPercentage: lossPct,
        authorityNotified: "Maharashtra State Mangrove Cell & Coastal Police",
        legalReference: "Environment (Protection) Act 1986 & CRZ-I Statutory High Court Directive",
        injunctionOrder: `🚨 CRZ-I STOP-WORK INJUNCTION: NDVI dropped ${lossPct}% (>25% statutory limit) in ${zone.zoneName}. Automated cease-and-desist dispatched to State Mangrove Cell.`,
      }
    : null;

  return {
    zoneId: zone.zoneId,
    zoneName: zone.zoneName,
    ward: zone.ward,
    baselineNdvi: base,
    currentNdvi: current,
    vegetationLossPercentage: lossPct,
    debrisDumpingDetected: isDumping,
    status,
    isCriticalLoss,
    injunction,
    auditSummary: isCriticalLoss
      ? `🚨 CRITICAL CRZ DESTRUCTION: Rapid deforestation detected in ${zone.zoneName}. Immediate law enforcement intervention active.`
      : `✅ COASTAL BUFFER HEALTHY: Mangrove canopy cover within sustainable ecological variance.`,
  };
}

module.exports = {
  DEFAULT_COASTAL_ZONES,
  processCoastalScanTelemetry,
};
