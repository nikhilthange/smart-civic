import api from "../lib/axios"

export interface DilapidatedBuilding {
  _id?: string
  buildingId: string
  buildingName: string
  ward: string
  address: string
  structuralCategory: "C1_DEMOLISH_IMMEDIATE" | "C2A_MAJOR_REPAIRS_EVACUATE" | "C2B_STRUCTURAL_REPAIR" | "C3_MINOR_REPAIR"
  occupancyStatus: "OCCUPIED" | "PARTIALLY_EVACUATED" | "FULLY_EVACUATED" | "DEMOLISHED"
  residentFamilyCount: number
  tiltAngleDegrees: number
  crackDisplacementMm: number
  vibrationIndexHz: number
  status: "STABLE_MONITORED" | "ELEVATED_VIBRATION" | "IMMINENT_COLLAPSE_HAZARD" | "EVACUATED_SECURED"
  transitCampAllocated: boolean
  transitCampLocation: string
}

export interface MangroveZone {
  _id?: string
  zoneId: string
  zoneName: string
  ward: string
  crzClassification: string
  baselineNdvi: number
  currentNdvi: number
  vegetationLossPercentage: number
  debrisDumpingDetected: boolean
  status: "PROTECTED_HEALTHY" | "MODERATE_DEPLETION" | "CRITICAL_CRZ_DESTRUCTION"
  injunctionNoticeIssued: boolean
  mangroveCellNotified: boolean
}

export interface HighRiseFireNoc {
  _id?: string
  buildingId: string
  buildingName: string
  ward: string
  address: string
  floorCount: number
  propertyTaxSacId: string
  fireNocExpiryDate: string
  fireNocStatus: "VALID" | "EXPIRED" | "AUDIT_CITATION_ISSUED"
  wetRiserPressureKgCm2: number
  pressureLossDurationMinutes: number
  refugeFloorEncroached: boolean
  sprinklerSystemActive: boolean
  mfbRadarFlagged: boolean
  status: "OPERATIONAL" | "DRY_RISER_FAILURE_CRITICAL" | "REFUGE_BLOCKED_VIOLATION"
}

export interface PropertyTaxDiscrepancy {
  _id?: string
  propertySacNo: string
  ward: string
  ownerName: string
  address: string
  assessedCarpetAreaSqFt: number
  lidarMeasuredAreaSqFt: number
  discrepancyPercentage: number
  permittedLandUse: string
  detectedActualUse: string
  hasRooftopExtension: boolean
  estimatedTaxDeficitInr: number
  penaltyAmountInr: number
  status: "CLEAN_ASSESSMENT" | "REVENUE_LEAKAGE_FLAGGED" | "DEMAND_NOTICE_SERVED"
}

export interface TransitLaneObstruction {
  _id?: string
  obstructionId: string
  bestBusVehicleId: string
  routeCorridorName: string
  ward: string
  vehiclePlateNo: string
  vehicleType: "PRIVATE_CAR" | "AUTO_RICKSHAW" | "COMMERCIAL_TRUCK" | "TWO_WHEELER"
  challanAmountInr: number
  transitDelaySeconds: number
  towingVehicleDispatched: boolean
  status: "CHALLAN_ISSUED" | "TOWING_DISPATCHED" | "PENALTY_PAID"
}

export interface AnimalWelfareRecord {
  _id?: string
  recordId: string
  ward: string
  locality: string
  animalType: "CANINE_STRAY" | "BOVINE_CATTLE"
  sterilizationStatus: "STERILIZED_EAR_NOTCHED" | "UNSTERILIZED" | "PENDING_ABC_SLOT" | "NONE"
  rfidMicrochipId: string
  lastRabiesVaccinationDate?: string
  packAggressionScore: number
  reportedDogBites30Days: number
  cattleImpoundStatus: "NONE" | "ROAMING_FREE_ROAD_HAZARD" | "IMPOUNDED_IN_MUNICIPAL_CORRAL"
  riskLevel: "LOW_WATCH" | "MODERATE_INTERVENTION" | "CRITICAL_RABIES_SURGE"
  riskScore?: number
}

export const cityOsApi = {
  // Module 1: C1 Dilapidated Building Radar
  getDilapidatedBuildings: async (ward?: string): Promise<{ buildings: DilapidatedBuilding[] }> => {
    const res = await api.get("/structural/buildings", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  ingestStructuralTelemetry: async (payload: { buildingId: string; tiltAngleDegrees: number; crackDisplacementMm: number; vibrationIndexHz?: number }) => {
    const res = await api.post("/structural/telemetry", payload)
    return res.data
  },
  issueEvacuationOrder: async (payload: { buildingId: string; transitCampLocation?: string }) => {
    const res = await api.post("/structural/evacuation-order", payload)
    return res.data
  },

  // Module 2: Mangrove & CRZ-I Sentinel
  getMangroveZones: async (ward?: string): Promise<{ zones: MangroveZone[] }> => {
    const res = await api.get("/coastal/zones", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  ingestCoastalScan: async (payload: { zoneId: string; baselineNdvi: number; currentNdvi: number; debrisDumpingDetected: boolean }) => {
    const res = await api.post("/coastal/scan-telemetry", payload)
    return res.data
  },
  issueMangroveInjunction: async (zoneId: string) => {
    const res = await api.post("/coastal/issue-injunction", { zoneId })
    return res.data
  },

  // Module 3: Fire Safety & Wet Riser Radar
  getFireSafetyBuildings: async (ward?: string): Promise<{ buildings: HighRiseFireNoc[] }> => {
    const res = await api.get("/fire-safety/buildings", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  ingestFireTelemetry: async (payload: { buildingId: string; wetRiserPressureKgCm2: number; pressureLossDurationMinutes: number }) => {
    const res = await api.post("/fire-safety/telemetry", payload)
    return res.data
  },
  auditRefugeArea: async (payload: { buildingId: string; refugeFloorEncroached: boolean }) => {
    const res = await api.post("/fire-safety/audit-refuge", payload)
    return res.data
  },

  // Module 4: 3D Spatial Property Tax
  getTaxDiscrepancies: async (ward?: string): Promise<{ properties: PropertyTaxDiscrepancy[] }> => {
    const res = await api.get("/tax-audit/discrepancies", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  reconcilePropertyTax: async (payload: any) => {
    const res = await api.post("/tax-audit/reconcile", payload)
    return res.data
  },

  // Module 5: BEST Transit Lane ANPR
  getTransitObstructions: async (ward?: string): Promise<{ obstructions: TransitLaneObstruction[] }> => {
    const res = await api.get("/transit-lane/obstructions", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  ingestDashcamViolation: async (payload: any) => {
    const res = await api.post("/transit-lane/dashcam-event", payload)
    return res.data
  },

  // Module 6: Animal Welfare & Rabies Radar
  getAnimalHotspots: async (ward?: string): Promise<{ hotspots: AnimalWelfareRecord[] }> => {
    const res = await api.get("/animal-welfare/hotspots", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  logBiteIncident: async (payload: any) => {
    const res = await api.post("/animal-welfare/log-bite", payload)
    return res.data
  },
  dispatchVeterinaryDrive: async (ward: string) => {
    const res = await api.post("/animal-welfare/vaccination-drive", { ward })
    return res.data
  },
}
