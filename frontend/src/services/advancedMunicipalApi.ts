import api from "../lib/axios"

export interface TrenchingPermit {
  _id?: string
  permitId: string
  agencyName: string
  ward: string
  roadName: string
  purpose: string
  estimatedLengthMeters: number
  reinstatementBondAmountInr: number
  startDate: string
  endDate: string
  status: "PENDING_COORDINATION" | "JOINT_TRENCHING_MERGED" | "APPROVED" | "DLP_BLOCKED" | "IN_PROGRESS" | "REINSTATED"
  isJointTrenching: boolean
  coordinatingAgencies: string[]
  sharedCostSavingsInr: number
  dlpCheckPassed?: boolean
}

export interface ConstructionSite {
  _id?: string
  siteId: string
  developerName: string
  projectName: string
  reraPermitNo: string
  ward: string
  address: string
  has35FtBarricadeCompliance: boolean
  hasWheelWashBasin: boolean
  hasAntiSmogGun: boolean
  currentPm10: number
  currentPm25: number
  stopWorkNoticeIssued: boolean
  totalPenaltiesLeviedInr: number
  status: "COMPLIANT" | "AIR_QUALITY_BREACH" | "STOP_WORK_NOTICE_ACTIVE" | "UNDER_AUDIT"
}

export interface WaterFlowZone {
  _id?: string
  zoneId: string
  zoneName: string
  ward: string
  masterReservoirInflowMld: number
  aggregateDmaOutflowMld: number
  lossPercentage: number
  status: "NORMAL" | "MODERATE_LOSS" | "CRITICAL_PIPELINE_THEFT_LEAK"
  pipelinePressurePsi: number
}

export interface WaterTankerPass {
  tripPassId: string
  tankerRegistrationNo: string
  driverName: string
  driverMobile: string
  capacityLiters: number
  fillingStationName: string
  destinationSociety: string
  destinationWard: string
  maxCappedRateInr: number
  qrSignatureHash: string
  status: string
  dispatchedAt: string
}

export interface VectorHotspot {
  clusterId: string
  ward: string
  locality: string
  diseaseType: "DENGUE" | "MALARIA" | "LEPTOSPIROSIS" | "CHIKUNGUNYA"
  reportedFeverCases: number
  larvalBreedingIndex: number
  stagnantWaterGrievanceCount: number
  riskScore: number
  riskLevel: "LOW" | "MODERATE" | "CRITICAL_EPIDEMIC_SURGE"
  status?: string
}

export interface CommercialTurf {
  _id?: string
  venueId: string
  venueName: string
  ward: string
  address: string
  operatingLicenseStatus: "ACTIVE" | "UNDER_INSPECTION" | "SUSPENDED" | "UNLICENSED"
  permittedCutoffHour: number
  lastRecordedDecibels: number
  lastRecordedLux: number
  totalViolationsCount: number
}

export interface SubwayStatus {
  _id?: string
  subwayId: string
  subwayName: string
  ward: string
  waterDepthCm: number
  criticalThresholdCm: number
  trafficStatus: "OPEN" | "RESTRICTED_SINGLE_LANE" | "SUBMERGED_CLOSED"
  safeDetourCorridor: string
  alternateFlyoverName: string
  activePumpsCount: number
}

export const advancedMunicipalApi = {
  // Module 1: Dig Once Trenching
  getTrenchingPermits: async (ward?: string): Promise<{ permits: TrenchingPermit[] }> => {
    const res = await api.get("/trenching/permits", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  requestTrenchingPermit: async (payload: any) => {
    const res = await api.post("/trenching/request", payload)
    return res.data
  },
  getTrenchingConflicts: async () => {
    const res = await api.get("/trenching/conflicts")
    return res.data
  },

  // Module 2: AQI & C&D Dust Barricade
  getConstructionSites: async (ward?: string): Promise<{ sites: ConstructionSite[] }> => {
    const res = await api.get("/aqi/sites", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  ingestAqiTelemetry: async (payload: { siteId: string; pm10: number; pm25: number; exceedanceDurationMinutes?: number }) => {
    const res = await api.post("/aqi/telemetry", payload)
    return res.data
  },
  verifyBarricades: async (payload: { has35FtBarricade: boolean; hasWheelWashBasin: boolean; hasAntiSmogGun: boolean }) => {
    const res = await api.post("/aqi/verify-barricade", payload)
    return res.data
  },

  // Module 3: Non-Revenue Water & QR Tankers
  getWaterAuditZones: async (ward?: string): Promise<{ zones: WaterFlowZone[] }> => {
    const res = await api.get("/water/audit-zones", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  createTankerTripPass: async (payload: any): Promise<{ pass: WaterTankerPass }> => {
    const res = await api.post("/water/tanker-pass", payload)
    return res.data
  },
  verifyTankerQr: async (payload: { tripPassId: string; qrSignatureHash: string; reportedPriceChargedInr?: number; maxCappedRateInr?: number }) => {
    const res = await api.post("/water/verify-tanker-qr", payload)
    return res.data
  },

  // Module 4: Vector GIS & Fogging
  getVectorHotspots: async (ward?: string): Promise<{ hotspots: VectorHotspot[] }> => {
    const res = await api.get("/vector/hotspots", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  getPsdFoggingRoute: async (ward: string) => {
    const res = await api.get(`/vector/fogging-route/${encodeURIComponent(ward)}`)
    return res.data
  },

  // Module 5: Turf Noise Monitor
  getTurfVenues: async (ward?: string): Promise<{ venues: CommercialTurf[] }> => {
    const res = await api.get("/turf/venues", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  reportTurfViolation: async (payload: { venueId: string; decibelsDba: number; luxLevel: number }) => {
    const res = await api.post("/turf/report-violation", payload)
    return res.data
  },

  // Module 6: Flooded Subways
  getSubways: async (ward?: string): Promise<{ subways: SubwayStatus[] }> => {
    const res = await api.get("/disaster/subways", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  ingestSubwayTelemetry: async (payload: { subwayId: string; waterDepthCm: number }) => {
    const res = await api.post("/disaster/telemetry", payload)
    return res.data
  },
}
