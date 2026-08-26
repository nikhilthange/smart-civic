"use strict";

const mongoose = require("mongoose");
const AnimalWelfareRecord = require("../models/AnimalWelfareRecord");

/**
 * ─── Animal Welfare (ABC), Stray Cattle & Rabies Radar Service ───────────────────
 */

const DEFAULT_ANIMAL_HOTSPOTS = [
  {
    recordId: "ABC-GN-01",
    ward: "Ward G-North",
    locality: "Dharavi 90 Feet Road & Leather Market",
    animalType: "CANINE_STRAY",
    sterilizationStatus: "UNSTERILIZED",
    rfidMicrochipId: "RFID-DOG-99214",
    lastRabiesVaccinationDate: new Date("2024-04-10"),
    packAggressionScore: 82,
    reportedDogBites30Days: 16,
    cattleImpoundStatus: "NONE",
    riskLevel: "CRITICAL_RABIES_SURGE",
    coordinates: [72.8520, 19.0430],
  },
  {
    recordId: "ABC-HW-02",
    ward: "Ward H-West",
    locality: "Bandra Carter Road Promenade & Fishing Village",
    animalType: "CANINE_STRAY",
    sterilizationStatus: "STERILIZED_EAR_NOTCHED",
    rfidMicrochipId: "RFID-DOG-11029",
    lastRabiesVaccinationDate: new Date("2026-02-15"),
    packAggressionScore: 35,
    reportedDogBites30Days: 2,
    cattleImpoundStatus: "NONE",
    riskLevel: "LOW_WATCH",
    coordinates: [72.8250, 19.0680],
  },
  {
    recordId: "ABC-KW-03",
    ward: "Ward K-West",
    locality: "S.V. Road Andheri West Wholesale Fruit Market",
    animalType: "BOVINE_CATTLE",
    sterilizationStatus: "NONE",
    rfidMicrochipId: "RFID-COW-44018",
    lastRabiesVaccinationDate: null,
    packAggressionScore: 68,
    reportedDogBites30Days: 0,
    cattleImpoundStatus: "ROAMING_FREE_ROAD_HAZARD",
    riskLevel: "MODERATE_INTERVENTION",
    coordinates: [72.8420, 19.1190],
  },
];

/**
 * Calculates Rabies & Bite Risk Index (0-100) combining dispensary bite cases and pack aggression
 */
function calculateRabiesRiskIndex(reportedDogBites = 12, packAggressionScore = 75) {
  const bites = Number(reportedDogBites);
  const aggression = Number(packAggressionScore);

  const score = Math.min(100, Math.round(bites * 4.5 + aggression * 0.45));

  let riskLevel = "LOW_WATCH";
  let recommendedAction = "ROUTINE_MONITORING";

  if (score >= 70) {
    riskLevel = "CRITICAL_RABIES_SURGE";
    recommendedAction = "IMMEDIATE_ABC_STERILIZATION_AND_ANTI_RABIES_DRIVE";
  } else if (score >= 40) {
    riskLevel = "MODERATE_INTERVENTION";
    recommendedAction = "SCHEDULED_MICROCHIPPING_AND_VACCINATION";
  }

  return {
    riskScore: score,
    riskLevel,
    recommendedAction,
  };
}

/**
 * Generates prioritized veterinary ABC sterilization and anti-rabies vaccination campaign plan
 */
function generateVeterinaryDrive(ward = "Ward G-North") {
  const hotspots = DEFAULT_ANIMAL_HOTSPOTS.filter((h) => !ward || ward === "all" || h.ward === ward);

  const targetClusters = (hotspots.length > 0 ? hotspots : DEFAULT_ANIMAL_HOTSPOTS).map((h) => {
    const risk = calculateRabiesRiskIndex(h.reportedDogBites30Days, h.packAggressionScore);
    return {
      ...h,
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel,
      action: risk.recommendedAction,
    };
  });

  return {
    driveId: `VET-DRIVE-${ward.replace(/\s+/g, "").slice(-4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
    ward,
    targetInterventionDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    assignedVeterinaryHospital: "Bai Sakarbai Dinshaw Petit Hospital for Animals (Parel)",
    estimatedVaccineDoses: targetClusters.length * 45,
    mobileAbcVansDispatched: 2,
    cattleImpoundTrucksDispatched: targetClusters.some((c) => c.animalType === "BOVINE_CATTLE") ? 1 : 0,
    clusters: targetClusters,
    dispatchOrder: `🐕 BMC VETERINARY DISPATCH: Target drive scheduled for ${targetClusters.length} sectors in ${ward}. 100% anti-rabies & ear-notching protocol active.`,
  };
}

module.exports = {
  DEFAULT_ANIMAL_HOTSPOTS,
  calculateRabiesRiskIndex,
  generateVeterinaryDrive,
};
