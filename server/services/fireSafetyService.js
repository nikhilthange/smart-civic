"use strict";

const mongoose = require("mongoose");
const HighRiseFireNoc = require("../models/HighRiseFireNoc");

/**
 * ─── High-Rise Fire Safety Wet-Riser & NOC Refuge Audit Service ──────────────────
 */

const DEFAULT_FIRE_BUILDINGS = [
  {
    buildingId: "FIRE-HW-01",
    buildingName: "Bandra Imperial Sky Heights (42 Floors)",
    ward: "Ward H-West",
    address: "Pali Hill Junction, Bandra West",
    floorCount: 42,
    propertyTaxSacId: "SAC-HW-881920",
    fireNocExpiryDate: new Date("2027-02-15"),
    fireNocStatus: "VALID",
    wetRiserPressureKgCm2: 2.1,
    pressureLossDurationMinutes: 45,
    refugeFloorEncroached: false,
    sprinklerSystemActive: true,
    mfbRadarFlagged: true,
    status: "DRY_RISER_FAILURE_CRITICAL",
    coordinates: [72.8290, 19.0640],
  },
  {
    buildingId: "FIRE-GS-04",
    buildingName: "Worli Seaface Residency (38 Floors)",
    ward: "Ward G-South",
    address: "Khan Abdul Ghaffar Khan Road, Worli",
    floorCount: 38,
    propertyTaxSacId: "SAC-GS-772109",
    fireNocExpiryDate: new Date("2027-08-20"),
    fireNocStatus: "VALID",
    wetRiserPressureKgCm2: 4.8,
    pressureLossDurationMinutes: 0,
    refugeFloorEncroached: false,
    sprinklerSystemActive: true,
    mfbRadarFlagged: false,
    status: "OPERATIONAL",
    coordinates: [72.8140, 19.0060],
  },
  {
    buildingId: "FIRE-GS-05",
    buildingName: "Lower Parel One Tower (64 Floors)",
    ward: "Ward G-South",
    address: "Senapati Bapat Marg, Lower Parel",
    floorCount: 64,
    propertyTaxSacId: "SAC-GS-990142",
    fireNocExpiryDate: new Date("2026-10-18"),
    fireNocStatus: "AUDIT_CITATION_ISSUED",
    wetRiserPressureKgCm2: 2.8,
    pressureLossDurationMinutes: 35,
    refugeFloorEncroached: false,
    sprinklerSystemActive: true,
    mfbRadarFlagged: true,
    status: "DRY_RISER_FAILURE_CRITICAL",
    coordinates: [72.8295, 18.9950],
  },
  {
    buildingId: "FIRE-GN-02",
    buildingName: "Kohinoor Square Commercial Tower (52 Floors)",
    ward: "Ward G-North",
    address: "N.C. Kelkar Marg, Dadar West",
    floorCount: 52,
    propertyTaxSacId: "SAC-GN-309114",
    fireNocExpiryDate: new Date("2027-06-30"),
    fireNocStatus: "VALID",
    wetRiserPressureKgCm2: 5.2,
    pressureLossDurationMinutes: 0,
    refugeFloorEncroached: false,
    sprinklerSystemActive: true,
    mfbRadarFlagged: false,
    status: "OPERATIONAL",
    coordinates: [72.8420, 19.0205],
  },
  {
    buildingId: "FIRE-KW-03",
    buildingName: "Lokhandwala Heights Residency (34 Floors)",
    ward: "Ward K-West",
    address: "Lokhandwala Complex 4th Cross Rd, Andheri West",
    floorCount: 34,
    propertyTaxSacId: "SAC-KW-449102",
    fireNocExpiryDate: new Date("2026-11-10"),
    fireNocStatus: "AUDIT_CITATION_ISSUED",
    wetRiserPressureKgCm2: 4.6,
    pressureLossDurationMinutes: 0,
    refugeFloorEncroached: true,
    sprinklerSystemActive: true,
    mfbRadarFlagged: true,
    status: "REFUGE_BLOCKED_VIOLATION",
    coordinates: [72.8260, 19.1410],
  },
  {
    buildingId: "FIRE-KW-06",
    buildingName: "Andheri Heights Grand Tower (40 Floors)",
    ward: "Ward K-West",
    address: "Veera Desai Road, Andheri West",
    floorCount: 40,
    propertyTaxSacId: "SAC-KW-662890",
    fireNocExpiryDate: new Date("2027-04-12"),
    fireNocStatus: "VALID",
    wetRiserPressureKgCm2: 5.0,
    pressureLossDurationMinutes: 0,
    refugeFloorEncroached: false,
    sprinklerSystemActive: true,
    mfbRadarFlagged: false,
    status: "OPERATIONAL",
    coordinates: [72.8350, 19.1320],
  },
];

/**
 * Ingests booster pump wet-riser pressure telemetry and triggers MFB alerts if < 3.5 kg/cm² for > 30 mins
 */
async function processFireRiserTelemetry({
  buildingId,
  wetRiserPressureKgCm2 = 2.1,
  pressureLossDurationMinutes = 45,
}) {
  const pressure = Number(wetRiserPressureKgCm2);
  const duration = Number(pressureLossDurationMinutes);

  const isLowPressure = pressure < 3.5;
  const isCriticalLoss = isLowPressure && duration >= 30;

  const status = isCriticalLoss
    ? "DRY_RISER_FAILURE_CRITICAL"
    : isLowPressure
    ? "DRY_RISER_FAILURE_CRITICAL"
    : "OPERATIONAL";

  let building = DEFAULT_FIRE_BUILDINGS.find((b) => b.buildingId === buildingId) || DEFAULT_FIRE_BUILDINGS[0];

  if (mongoose.connection && mongoose.connection.readyState === 1 && buildingId) {
    try {
      const dbBld = await HighRiseFireNoc.findOne({ buildingId });
      if (dbBld) {
        dbBld.wetRiserPressureKgCm2 = pressure;
        dbBld.pressureLossDurationMinutes = duration;
        dbBld.status = status;
        if (isCriticalLoss) {
          dbBld.mfbRadarFlagged = true;
          dbBld.fireNocStatus = "AUDIT_CITATION_ISSUED";
        }
        await dbBld.save();
        building = dbBld;
      }
    } catch {
      // continue
    }
  }

  const mfbDispatchNotice = isCriticalLoss
    ? {
        citationId: `MFB-NOC-${building.buildingId}-${Date.now().toString().slice(-4)}`,
        buildingName: building.buildingName,
        ward: building.ward,
        floors: building.floorCount,
        sacId: building.propertyTaxSacId,
        alertType: "WET_RISER_DEPRESSURIZED_FAILURE",
        recordedPressureKgCm2: pressure,
        lossDurationMinutes: duration,
        citationPenaltyInr: 25000,
        mfbStationNotified: "Mumbai Fire Brigade Headquarters Byculla & Local Ward Fire Station",
        taxNotice: `Statutory ₹25,000 fire safety citation debited against Property Tax SAC Account (${building.propertyTaxSacId}).`,
      }
    : null;

  return {
    buildingId: building.buildingId,
    buildingName: building.buildingName,
    ward: building.ward,
    floorCount: building.floorCount,
    propertyTaxSacId: building.propertyTaxSacId,
    wetRiserPressureKgCm2: pressure,
    pressureLossDurationMinutes: duration,
    status,
    isCriticalLoss,
    mfbRadarFlagged: isCriticalLoss || building.mfbRadarFlagged,
    mfbDispatchNotice,
    statusMessage: isCriticalLoss
      ? `🚨 CRITICAL DRY RISER: Booster pump pressure (${pressure} kg/cm²) &lt; 3.5 kg/cm² threshold for ${duration} mins. High-rise flagged in MFB live dispatch radar.`
      : `✅ WET RISER PRESSURIZED: Booster pressure (${pressure} kg/cm²) compliant with Maharashtra Fire Prevention Act.`,
  };
}

module.exports = {
  DEFAULT_FIRE_BUILDINGS,
  processFireRiserTelemetry,
};
