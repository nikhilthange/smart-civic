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

  // Module 7: Live Simulation & Telemetry Triggers
  generateSimulationData: async (count: number = 3) => {
    const res = await api.post("/simulator/generate", { count })
    return res.data
  },
  triggerSimulationTick: async () => {
    const res = await api.post("/simulator/tick")
    return res.data
  },
  simulateSubwaySpike: async (payload: { subwayId?: string; depthCm?: number }) => {
    const res = await api.post("/simulator/subway-spike", payload)
    return res.data
  },
  simulateBinFill: async (payload: { binId?: string; fillPercentage?: number }) => {
    const res = await api.post("/simulator/bin-fill", payload)
    return res.data
  },
  simulateBuildingTilt: async (payload: { buildingId?: string; tiltMm?: number }) => {
    const res = await api.post("/simulator/building-tilt", payload)
    return res.data
  },
  simulateCctvAnomaly: async (payload: { cameraId?: string; anomalyType?: string }) => {
    const res = await api.post("/simulator/cctv-anomaly", payload)
    return res.data
  },
  getSimulatorStatus: async () => {
    const res = await api.get("/simulator/status")
    return res.data
  },

  // Module 8: Maharashtra Right to Service (RTS Act 2015) Statutory Enforcement
  getRtsPenalties: async (params?: { ward?: string; status?: string; officerEmployeeId?: string }): Promise<{ count: number; penalties: RtsStatutoryPenalty[] }> => {
    const res = await api.get("/rts/penalties", { params })
    return res.data
  },
  getRtsSummary: async (): Promise<{ summary: RtsSummary }> => {
    const res = await api.get("/rts/summary")
    return res.data
  },
  runRtsComplianceAudit: async () => {
    const res = await api.post("/rts/audit")
    return res.data
  },
  adjudicateRtsPenalty: async (noticeNumber: string, payload: { decision: string; note?: string; adjudicatedBy?: string }) => {
    const res = await api.post(`/rts/adjudicate/${encodeURIComponent(noticeNumber)}`, payload)
    return res.data
  },
  compensateRtsCitizen: async (noticeNumber: string) => {
    const res = await api.post(`/rts/compensate-citizen/${encodeURIComponent(noticeNumber)}`)
    return res.data
  },

  // Module 9: Court Evidentiary Dossier (Sec 65B) & Autonomous Emergency Re-Tendering
  getComplaintCourtDossier: async (complaintId: string): Promise<CourtEvidentiaryDossier> => {
    const res = await api.get(`/legal-dossier/complaint/${complaintId}`)
    return res.data
  },
  executeEmergencyRetender: async (complaintId: string, authorizingOfficer?: string): Promise<EmergencyRetenderResult> => {
    const res = await api.post(`/legal-dossier/emergency-retender/${complaintId}`, { authorizingOfficer })
    return res.data
  },
  getWardSystemicDossier: async (ward: string): Promise<WardSystemicDossier> => {
    const res = await api.get(`/legal-dossier/ward/${encodeURIComponent(ward)}`)
    return res.data
  },
}

export interface RtsStatutoryPenalty {
  _id?: string
  noticeNumber: string
  complaintId: string
  complaintTitle: string
  ward: string
  category: string
  designatedOfficer: {
    officerId: string
    employeeId: string
    name: string
    designation: string
    departmentCode: string
  }
  complainantCitizen: {
    citizenId: string
    name: string
    email: string
  }
  statutoryTimeLimitHours: number
  elapsedHours: number
  delayDays: number
  dailyPenaltyRateInr: number
  statutoryPenaltyCapInr: number
  totalPenaltyAmountInr: number
  status: "SHOW_CAUSE_ISSUED" | "SALARY_DEDUCTION_ENFORCED" | "CITIZEN_COMPENSATED" | "FORCE_MAJEURE_EXCUSED"
  appellateAuthority: string
  hearingDate: string
  adjudicationNote?: string
  adjudicatedAt?: string
  adjudicatedBy?: string
  citizenCompensationPaidInr: number
  citizenCompensationVoucher?: string
  compensatedAt?: string
  legalNoticeHash: string
  createdAt: string
}

export interface RtsSummary {
  global: {
    totalNotices: number
    totalPenaltyAssessedInr: number
    totalSalaryDeductedInr: number
    totalCitizenCompensationDisbursedInr: number
    activeShowCausesCount: number
  }
  wardBreakdown: {
    _id: string
    noticesCount: number
    salaryDeductedInr: number
    compensationDisbursedInr: number
  }[]
}

export interface CourtEvidentiaryDossier {
  success: boolean
  dossierId: string
  generatedAt: string
  complaint: {
    id: string
    complaintId: string
    title: string
    description: string
    category: string
    priority: string
    status: string
    ward: string
    coordinates: [number, number]
    address: string
    imageUrl?: string | null
    citizenName: string
    createdAt: string
    slaDeadline: string
    isOverdue: boolean
    daysOverdue: number
  }
  rtsPenalty?: {
    noticeNumber: string
    statutoryCategory: string
    designatedOfficer: {
      name: string
      designation: string
      ward: string
    }
    daysOverdue: number
    penaltyAmountInr: number
    adjudicationStatus: string
    legalNoticeHash: string
  }
  contractorEscrow?: {
    escrowId: string
    companyName: string
    collateralAmountInr: number
    slashedAmountInr: number
    dlpRetainedAmountInr: number
    status: string
    slashedReason?: string
  }
  section65BCertificate: {
    certificateNumber: string
    statutoryProvision: string
    certifyingOfficer: {
      title: string
      authority: string
      systemNodeId: string
    }
    digitalFingerprintSha256: string
    issuedAt: string
    evidentiaryIntegrityDeclaration: string
  }
  chainOfCustody: {
    step: number
    event: string
    timestamp: string
    actor: string
    details: string
    hash: string
  }[]
  highCourtPilDraft: {
    forum: string
    causeTitle: string
    parties: {
      petitioner: string
      respondent1: string
      respondent2: string
      respondent3: string
    }
    statutoryGrounds: string[]
    prayerClauses: string[]
  }
  rtiSection6Application: {
    addressedTo: string
    applicationSubject: string
    requisitions: string[]
    statutoryFee: string
    statutoryDeadlineDays: number
  }
}

export interface EmergencyRetenderResult {
  success: boolean
  message: string
  retenderReceipt: {
    receiptNumber: string
    complaintId: string
    complaintTitle: string
    ward: string
    forfeitedContractor: string
    forfeitedAmountInr: number
    awardedContractor: {
      contractorId: string
      companyName: string
      reliabilityScore: number
      authorizedContact: string
    }
    newEscrowId: string
    expeditedSlaHours: number
    expeditedSlaDeadline: string
    authorizingAuthority: string
    transactionHashSha256: string
    executedAt: string
  }
}

export interface WardSystemicDossier {
  success: boolean
  ward: string
  auditTimestamp: string
  systemicFingerprintSha256: string
  summary: {
    totalComplaintsLogged: number
    chronicBreachedComplaints: number
    breachPercentage: number
    totalOfficerRtsPenaltiesInr: number
    totalContractorEscrowSlashedInr: number
    aggregatePublicDividendRecoverableInr: number
  }
  chronicDefectDocket: any[]
  legalRemedyRecommended: string
}



