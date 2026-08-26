import api from "../lib/axios"

export interface HotspotRisk {
  id: string
  name: string
  ward: string
  coordinates: [number, number]
  catchmentNullah: string
  criticalFloodThresholdRainMm: number
  pumpingStation: string
  elevationMetersAboveSeaLevel: number
  riskScore: number
  alertLevel: "GREEN_NORMAL" | "AMBER_WARNING" | "RED_EMERGENCY"
  inundationDepthCm: number
  trafficAdvisory: string
}

export interface PumpingStation {
  id: string
  name: string
  dischargeCapacityCubicMPerSec: number
  activePumps: number
  totalPumps: number
  status: string
}

export interface FloodRadarResponse {
  telemetry: {
    currentRainfallMmPerHr: number
    tide: {
      tideHeightMeters: number
      isHighTideWarning: boolean
      isSpringTide: boolean
      tidalState: string
      nextHighTide: string
      nextLowTide: string
    }
    overallCityStatus: string
    activeFloodHotspots: number
    totalActivePumpingCapacityCubicMPerSec: number
  }
  hotspots: HotspotRisk[]
  pumpingStations: PumpingStation[]
}

export interface RoadContract {
  _id: string
  contractId: string
  roadName: string
  ward: string
  contractorName: string
  surfaceType: string
  completionDate: string
  dlpExpiryDate: string
  totalProjectCostInr: number
  retentionFundAmountInr: number
  retentionFundFrozen: boolean
  activeDefectCount: number
  status: "ACTIVE_WARRANTY" | "WARRANTY_EXPIRED" | "PENALTY_LOCKED" | "REPAIR_IN_PROGRESS"
}

export interface SmartBin {
  _id: string
  binId: string
  rfidTag: string
  ward: string
  locality: string
  capacityLiters: number
  currentFillPercentage: number
  status: "CLEANED" | "NORMAL" | "NEAR_FULL" | "OVERFLOWING"
  wasteType: string
  lastLiftedAt: string
  lastGrossWeightKg: number
}

export interface WardProject {
  _id: string
  projectId: string
  title: string
  description: string
  ward: string
  category: string
  estimatedBudgetInr: number
  fundsDisbursedInr: number
  votesCount: number
  status: string
  corporatorName: string
  estimatedBeneficiaryCitizens: number
}

export interface CorporatorLedger {
  ward: string
  fiscalYear: string
  annualAllocationInr: number
  committedProjectsBudgetInr: number
  disbursedExpenditureInr: number
  unallocatedBalanceInr: number
  utilizationPercentage: number
  corporatorName: string
  auditedProjects: WardProject[]
}

export const municipalApi = {
  // Module 1: Monsoon & Nullah Desilting
  getFloodRadar: async (rainfallMm?: number): Promise<FloodRadarResponse> => {
    const res = await api.get("/monsoon/flood-radar", {
      params: rainfallMm ? { rainfallMm } : {},
    })
    return res.data
  },
  verifyDesilting: async (payload: any) => {
    const res = await api.post("/monsoon/verify-desilting", payload)
    return res.data
  },

  // Module 3: 3D Pothole Sizer & DLP Warranty
  getRoadContracts: async (ward?: string): Promise<{ contracts: RoadContract[] }> => {
    const res = await api.get("/dlp/contracts", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  estimatePotholeVolume: async (dimensions: {
    lengthCm: number
    widthCm: number
    depthCm: number
    surfaceType?: string
  }) => {
    const res = await api.post("/dlp/estimate-volume", dimensions)
    return res.data
  },
  freezeDlpRetention: async (contractId: string, reason?: string) => {
    const res = await api.post(`/dlp/freeze-retention/${contractId}`, { reason })
    return res.data
  },

  // Module 4: SWM Compactor Fleet & RFID Bins
  getSmartBins: async (ward?: string): Promise<{ bins: SmartBin[] }> => {
    const res = await api.get("/swm/bins", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  logRfidLift: async (rfidTag: string, grossWeightKg?: number) => {
    const res = await api.post("/swm/rfid-lift", { rfidTag, grossWeightKg })
    return res.data
  },
  getFleetStatus: async () => {
    const res = await api.get("/swm/fleet-status")
    return res.data
  },

  // Module 5: Encroachment & No-Hawking Zones
  getHawkingZones: async (ward?: string) => {
    const res = await api.get("/encroachment/zones", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },

  // Module 6: Participatory Ward Budgeting & Corporator Ledger
  getWardProjects: async (ward?: string): Promise<{ projects: WardProject[] }> => {
    const res = await api.get("/ward-budget/projects", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  castVote: async (projectId: string) => {
    const res = await api.post(`/ward-budget/vote/${projectId}`)
    return res.data
  },
  getCorporatorLedger: async (ward: string): Promise<CorporatorLedger> => {
    const res = await api.get(`/ward-budget/corporator-ledger/${encodeURIComponent(ward)}`)
    return res.data
  },
}
