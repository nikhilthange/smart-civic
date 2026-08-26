import api from "../lib/axios"

export interface CctvCameraData {
  _id?: string
  cameraId: string
  cameraName: string
  junction: string
  ward: string
  streamUrl: string
  feedStatus: "ONLINE_STREAMING" | "OFFLINE_MAINTENANCE" | "ANOMALY_FLAGGED"
  activeAnalytics: string[]
  lastDetectedAnomaly?: {
    anomalyType: string
    confidence: number
    detectedAt: string
    autoComplaintId: string
    boundingBox: number[]
  } | null
  coordinates: [number, number]
}

export interface StatutoryNoticePayload {
  noticeType: "SECTION_354_BUILDING_EVACUATION" | "SECTION_314_ENCROACHMENT" | "DLP_WARRANTY_BREACH"
  recipientName: string
  ward: string
  locationOrAddress: string
  statutoryGrounds: string
  allocatedTransitCamp?: string
  penaltyInr?: number
}

export interface StatutoryNoticeResponse {
  noticeNo: string
  noticeType: string
  ward: string
  recipientName: string
  locationOrAddress: string
  dateFormatted: string
  sha256SealHash: string
  qrVerificationPayload: {
    noticeNo: string
    verificationUrl: string
    sha256SealHash: string
    issuedBy: string
    timestamp: string
  }
  formattedNoticeText: string
  isLegallyEnforceable: boolean
}

export interface GreenBondPortfolio {
  bondSeries: string
  totalIssuanceAmountInr: number
  couponRatePercent: number
  maturityYears: number
  creditRating: string
  escrowBacking: string
  totalCarbonCreditsEarnedTonnes: number
  carbonOffsetValueInr: number
}

export interface CarbonStream {
  streamId: string
  sector: string
  ward: string
  processedTonnage: number
  carbonOffsetTons: number
  annualRevenueInr: number
}

export interface PredictiveBudgetResponse {
  ward: string
  fiscalYear: string
  historicalRoadDefects: number
  nullahDesiltingLengthKm: number
  projectedRainfallAnomalyPercent: number
  budgetBreakdown: {
    roadMaintenanceOpExInr: number
    swdDesiltingOpExInr: number
    climateResilienceCapExInr: number
    totalRecommendedBudgetInr: number
  }
  greenBondFundingAllocationInr: number
  budgetUtilizationEfficiencyScore: number
  executiveRecommendation: string
}

export const nextGenApi = {
  // CCTV Analytics
  getCctvCameras: async (ward?: string): Promise<{ cameras: CctvCameraData[] }> => {
    const res = await api.get("/cctv/cameras", {
      params: ward && ward !== "all" ? { ward } : {},
    })
    return res.data
  },
  analyzeCctvFrame: async (payload: {
    cameraId: string
    simulatedAnomalyType: string
    confidence: number
  }) => {
    const res = await api.post("/cctv/analyze-frame", payload)
    return res.data
  },

  // Statutory Notices
  generateNoticePdf: async (payload: StatutoryNoticePayload): Promise<{ notice: StatutoryNoticeResponse }> => {
    const res = await api.post("/notices/generate-pdf", payload)
    return res.data
  },

  // Green Bonds & Predictive Budget
  getGreenBondPortfolio: async (): Promise<{
    portfolio: GreenBondPortfolio
    carbonStreams: CarbonStream[]
  }> => {
    const res = await api.get("/green-bonds/portfolio")
    return res.data
  },
  getPredictiveBudget: async (payload: {
    ward: string
    historicalRoadDefects: number
    nullahDesiltingLengthKm: number
    projectedRainfallAnomalyPercent: number
  }): Promise<{ budget: PredictiveBudgetResponse }> => {
    const res = await api.post("/green-bonds/predictive-budget", payload)
    return res.data
  },
}
