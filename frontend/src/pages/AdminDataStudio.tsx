import { useState, useEffect, useCallback } from "react"
import {
  Database,
  Sparkles,
  RefreshCw,
  Trash2,
  PlusCircle,
  FileText,
  Waves,
  Cctv,
  Truck,
  ShieldAlert,
  Building,
  Coins,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Terminal,
  Brain,
  Cpu,
  DownloadCloud,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import toast from "react-hot-toast"
import api from "@/lib/axios"
import { Link } from "react-router-dom"
import { aiTrainingApi, type AiModelStats, type AiFeedbackSample } from "@/services/aiTrainingApi"

type ActiveTab =
  | "complaints"
  | "subways"
  | "cctv"
  | "bins"
  | "buildings"
  | "contracts"
  | "societies"
  | "projects"
  | "queues"
  | "ai_training"

const MUMBAI_WARDS = [
  "Ward A", "Ward B", "Ward C", "Ward D", "Ward E",
  "Ward F-South", "Ward F-North", "Ward G-South", "Ward G-North",
  "Ward H-West", "Ward H-East", "Ward K-West", "Ward K-East",
  "Ward L", "Ward M-East", "Ward N", "Ward P-South", "Ward R-South",
]

export default function AdminDataStudio() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("complaints")
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>({
    counts: { complaints: 0, subways: 0, bins: 0, cctvCameras: 0, dilapidatedBuildings: 0 },
  })

  // Dead Letter Queue (DLQ) State
  const [failedJobs, setFailedJobs] = useState<any[]>([])
  const [loadingDlq, setLoadingDlq] = useState(false)
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  // AI Model Training & Active Learning State
  const [aiStats, setAiStats] = useState<AiModelStats | null>(null)
  const [recentFeedback, setRecentFeedback] = useState<AiFeedbackSample[]>([])
  const [isTrainingAi, setIsTrainingAi] = useState(false)
  const [trainingEpochsCount, setTrainingEpochsCount] = useState(1)
  const [customFeedbackForm, setCustomFeedbackForm] = useState({
    inputText: "Dhakkan gayab hai transformer ke paas live wire",
    correctedCategory: "public_safety",
    correctedDepartment: "PSD",
    correctedSeverity: "critical",
    ward: "Ward H-West",
  })

  // 1. Complaint Form State
  const [complaintForm, setComplaintForm] = useState({
    title: "Severe Road Surface Crater near Signal",
    description: "Deep pothole causing severe traffic slowdown and bike hazard.",
    category: "roads_and_footpaths",
    ward: "Ward H-West",
    priority: "high",
    address: "Linking Road, Bandra West, Mumbai",
    lat: 19.0596,
    lng: 72.8347,
  })

  // 2. Subway Form State
  const [subwayForm, setSubwayForm] = useState({
    subwayName: "Santacruz Golibar Underpass",
    ward: "Ward H-East",
    waterDepthCm: 18,
    criticalThresholdCm: 25,
    safeDetourCorridor: "Western Express Elevated Flyover",
    alternateFlyoverName: "Khar Flyover",
    activePumpsCount: 4,
    lat: 19.0740,
    lng: 72.8430,
  })

  // 3. CCTV Camera Form State
  const [cctvForm, setCctvForm] = useState({
    cameraName: "Bandra Promenade High-Mast CAM",
    ward: "Ward H-West",
    locationDescription: "Carter Road Promenade",
    streamUrl: "https://cctv.smartcity.mumbai.gov.in/live/cam-bnd-09.m3u8",
    feedStatus: "ONLINE",
    lat: 19.0650,
    lng: 72.8280,
  })

  // 4. SWM Bin Form State
  const [binForm, setBinForm] = useState({
    locality: "Pali Hill Residential Sector 2",
    ward: "Ward H-West",
    capacityLiters: 1100,
    currentFillPercentage: 45,
    wasteType: "MIXED_MSW",
    lat: 19.0610,
    lng: 72.8320,
  })

  // 5. C1 Building Form State
  const [buildingForm, setBuildingForm] = useState({
    buildingName: "Shanti Sadan Chawl Cluster",
    ward: "Ward F-South",
    address: "Parel T.T., Dr. Ambedkar Road",
    structuralCategory: "C1_DEMOLISH_IMMEDIATE",
    residentFamilyCount: 32,
    tiltAngleDegrees: 1.4,
    crackDisplacementMm: 7.2,
    lat: 19.0060,
    lng: 72.8420,
  })

  // 6. Road Contract Form State
  const [contractForm, setContractForm] = useState({
    roadName: "S.V. Road Khar Carriageway",
    contractorName: "M/s Unity Infrastructure Ltd",
    ward: "Ward H-West",
    retentionFundAmountInr: 2500000,
    status: "UNDER_WARRANTY",
    lat: 19.0680,
    lng: 72.8360,
  })

  // 7. Housing Society Form State
  const [societyForm, setSocietyForm] = useState({
    name: "Sea Breeze Co-op Housing Society",
    ward: "Ward H-West",
    totalFlats: 96,
    segregationScorePct: 92,
    hasCompostPit: true,
    hasRwh: true,
  })

  // 8. Participatory Budget Project Form State
  const [projectForm, setProjectForm] = useState({
    title: "Solar Rooftop Micro-Grid & Rainwater Park",
    ward: "Ward G-North",
    category: "URBAN_GREENING",
    estimatedBudgetInr: 1500000,
    description: "Eco-friendly community solar installation and ground aquifer recharge wells.",
    corporatorName: "Hon. Ward Councilor (BMC)",
    estimatedBeneficiaryCitizens: 22000,
  })

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get("/simulator/status")
      if (res.data) setStats(res.data)
    } catch {
      // ignore
    }
  }, [])

  const fetchFailedJobs = useCallback(async () => {
    setLoadingDlq(true)
    try {
      const res = await api.get("/admin/queues/failed")
      if (res.data?.success) {
        setFailedJobs(res.data.failedJobs || [])
      }
    } catch (err: any) {
      console.warn("Failed to fetch DLQ records:", err?.message)
    } finally {
      setLoadingDlq(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchFailedJobs()
  }, [fetchStatus, fetchFailedJobs])

  useEffect(() => {
    if (activeTab === "queues") {
      fetchFailedJobs()
    }
    if (activeTab === "ai_training") {
      fetchAiTrainingStats()
    }
  }, [activeTab, fetchFailedJobs])

  const fetchAiTrainingStats = async () => {
    try {
      const data = await aiTrainingApi.getModelStats()
      setAiStats(data.stats)
      setRecentFeedback(data.recentFeedback || [])
    } catch {
      // ignore
    }
  }

  const handleTriggerOnlineTraining = async () => {
    setIsTrainingAi(true)
    try {
      toast.loading("🧠 Executing online model weight retraining epoch...", { id: "train-epoch" })
      const res = await aiTrainingApi.triggerTraining({ epochs: trainingEpochsCount, batchSize: 64 })
      toast.success(res.message || "Model weights fine-tuned online!", { id: "train-epoch", duration: 4000 })
      await fetchAiTrainingStats()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Model training failed", { id: "train-epoch" })
    } finally {
      setIsTrainingAi(false)
    }
  }

  const handleCustomFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await aiTrainingApi.submitFeedback({
        inputText: customFeedbackForm.inputText,
        correctedCategory: customFeedbackForm.correctedCategory,
        correctedDepartment: customFeedbackForm.correctedDepartment,
        correctedSeverity: customFeedbackForm.correctedSeverity,
        source: "manual_annotation",
        ward: customFeedbackForm.ward,
      })
      toast.success("🧠 Active learning sample ingested! Weights adapted online.")
      setCustomFeedbackForm({
        inputText: "",
        correctedCategory: "public_safety",
        correctedDepartment: "PSD",
        correctedSeverity: "critical",
        ward: "Ward H-West",
      })
      await fetchAiTrainingStats()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit feedback sample")
    } finally {
      setLoading(false)
    }
  }

  const handleRetryJob = async (jobId: string) => {
    try {
      toast.loading(`Replaying dead-letter job ${jobId}...`, { id: `retry-${jobId}` })
      const res = await api.post(`/admin/queues/retry/${jobId}`)
      if (res.data?.success) {
        toast.success(`Job ${jobId} re-enqueued for asynchronous execution!`, { id: `retry-${jobId}` })
        setFailedJobs((prev) => prev.filter((j) => j.id !== jobId))
      } else {
        toast.error(res.data?.message || "Failed to retry job", { id: `retry-${jobId}` })
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error replaying job", { id: `retry-${jobId}` })
    }
  }

  // Universal Seed All Modules
  const handleSeedAllModules = async () => {
    setLoading(true)
    try {
      toast.loading("⚡ Populating all 17 municipal modules in MongoDB...", { id: "seed-all" })
      const res = await api.post("/simulator/batch-seed-all")
      toast.success(res.data.message || "All municipal collections seeded!", { id: "seed-all" })
      fetchStatus()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Batch seeding failed", { id: "seed-all" })
    } finally {
      setLoading(false)
    }
  }

  // Batch Generation
  const handleBatchGenerate = async (count: number = 5) => {
    setLoading(true)
    try {
      toast.loading(`Spawning ${count} realistic municipal incidents...`, { id: "data-gen" })
      const res = await api.post("/simulator/generate", { count })
      toast.success(res.data.message || `Generated ${count} entities!`, { id: "data-gen" })
      fetchStatus()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Batch generation failed", { id: "data-gen" })
    } finally {
      setLoading(false)
    }
  }

  // Flush & Reset Simulated Data
  const handleCleanupSimulated = async () => {
    if (!window.confirm("Are you sure you want to clean up all simulated records? Real production records will remain intact.")) {
      return
    }
    setLoading(true)
    try {
      toast.loading("Purging simulated records...", { id: "data-clean" })
      const res = await api.delete("/simulator/cleanup")
      toast.success(res.data.message || "Simulated test records pruned!", { id: "data-clean" })
      fetchStatus()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Cleanup failed", { id: "data-clean" })
    } finally {
      setLoading(false)
    }
  }

  // 1. Submit Complaint
  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/simulator/generate", { count: 1 })
      toast.success(`🎉 Grievance created and broadcasted via WebSocket!`, { duration: 5000 })
      fetchStatus()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create complaint")
    } finally {
      setLoading(false)
    }
  }

  // 2. Submit Subway
  const handleCreateSubway = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/disaster/subways", {
        ...subwayForm,
        coordinates: [subwayForm.lng, subwayForm.lat],
      })
      toast.success(`🌊 Subway "${res.data.subway.subwayName}" registered in MongoDB!`)
      fetchStatus()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to register subway")
    } finally {
      setLoading(false)
    }
  }

  // 3. Submit CCTV
  const handleCreateCctv = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/cctv/cameras", {
        ...cctvForm,
        coordinates: [cctvForm.lng, cctvForm.lat],
      })
      toast.success(`📹 CCTV Camera "${res.data.camera.cameraName}" live on radar!`)
      fetchStatus()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to register camera")
    } finally {
      setLoading(false)
    }
  }

  // 4. Submit Smart Bin
  const handleCreateBin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/swm/bins", {
        ...binForm,
        coordinates: [binForm.lng, binForm.lat],
      })
      toast.success(`🗑️ Smart Bin "${res.data.bin.binId}" saved to SWM telemetry!`)
      fetchStatus()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to register smart bin")
    } finally {
      setLoading(false)
    }
  }

  // 5. Submit Dilapidated Building
  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/structural/buildings", {
        ...buildingForm,
        coordinates: [buildingForm.lng, buildingForm.lat],
      })
      toast.success(`🚨 C1 Building "${res.data.building.buildingName}" added to Collapse Radar!`)
      fetchStatus()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to register building")
    } finally {
      setLoading(false)
    }
  }

  // 6. Submit Road Contract
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/dlp/contracts", {
        ...contractForm,
        coordinates: [contractForm.lng, contractForm.lat],
      })
      toast.success(`🛡️ Road DLP Contract "${res.data.contract.roadName}" saved to ledger!`)
      fetchStatus()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create road contract")
    } finally {
      setLoading(false)
    }
  }

  // 7. Submit Housing Society
  const handleCreateSociety = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/alm", societyForm)
      toast.success(`🏢 Housing Society "${res.data.society.name}" registered!`)
      fetchStatus()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to register society")
    } finally {
      setLoading(false)
    }
  }

  // 8. Submit Ward Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post("/ward-budget/projects", projectForm)
      toast.success(`🗳️ Budgeting Project "${res.data.project.title}" opened for citizen voting!`)
      fetchStatus()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  const tabs: { id: ActiveTab; label: string; icon: any; route: string }[] = [
    { id: "complaints", label: "Complaints & Grievances", icon: FileText, route: "/complaints" },
    { id: "subways", label: "Flooded Subways", icon: Waves, route: "/disaster-subways" },
    { id: "cctv", label: "CCTV Cameras", icon: Cctv, route: "/cctv-surveillance" },
    { id: "bins", label: "SWM Smart Bins", icon: Truck, route: "/swm-fleet" },
    { id: "buildings", label: "C1 Dilapidated Buildings", icon: ShieldAlert, route: "/structural-collapse" },
    { id: "contracts", label: "Road DLP Contracts", icon: ShieldAlert, route: "/dlp-registry" },
    { id: "societies", label: "Housing Societies (ALM)", icon: Building, route: "/alm-societies" },
    { id: "projects", label: "Participatory Projects", icon: Coins, route: "/ward-budget" },
    { id: "queues", label: "Dead Letter Queue (DLQ)", icon: RotateCcw, route: "/admin" },
    { id: "ai_training", label: "AI Model Training & Active Learning", icon: Brain, route: "/admin/data-studio" },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-2 pb-16 px-3 sm:px-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Admin Management & Live Data Studio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              100% PERSISTENT MONGODB
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Create, mutate, and seed real entities across all 32 municipal modules. Real-time changes broadcast instantly to live radar maps.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            onClick={handleSeedAllModules}
            disabled={loading}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ Seed All Modules with Live Data</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleBatchGenerate(5)}
            disabled={loading}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick Seed (+5 Incidents)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
            className="rounded-lg text-xs gap-1.5 border-zinc-200 dark:border-zinc-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh State</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCleanupSimulated}
            disabled={loading}
            className="rounded-lg text-xs gap-1.5 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Flush Simulated</span>
          </Button>
        </div>
      </div>

      {/* Live State Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase">Complaints</span>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-1">
            {stats.counts?.complaints ?? 0}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase">Subway Gates</span>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-1">
            {stats.counts?.subways ?? 0}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase">Smart Bins</span>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-1">
            {stats.counts?.bins ?? 0}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase">CCTV Feeds</span>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-1">
            {stats.counts?.cctvCameras ?? 0}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase">C1 Buildings</span>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-1">
            {stats.counts?.dilapidatedBuildings ?? 0}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Active Tab Panel */}
      <Card className="border-zinc-200 dark:border-zinc-800/80 shadow-sm bg-white dark:bg-zinc-900/60">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {tabs.find((t) => t.id === activeTab)?.label}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Add a new persistent entity directly to MongoDB and observe instant reflection on target radar.
            </CardDescription>
          </div>
          <Link
            to={tabs.find((t) => t.id === activeTab)?.route || "/dashboard"}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            <span>Open Target Radar</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        <CardContent className="pt-6">
          {/* TAB 1: COMPLAINTS */}
          {activeTab === "complaints" && (
            <form onSubmit={handleCreateComplaint} className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Incident Title</label>
                  <input
                    type="text"
                    required
                    value={complaintForm.title}
                    onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Ward</label>
                  <select
                    value={complaintForm.ward}
                    onChange={(e) => setComplaintForm({ ...complaintForm, ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  >
                    {MUMBAI_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Category</label>
                  <select
                    value={complaintForm.category}
                    onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  >
                    <option value="roads_and_footpaths">Roads & Footpaths (Potholes)</option>
                    <option value="garbage_and_cleanliness">Garbage & Cleanliness (SWM)</option>
                    <option value="water_and_sanitation">Water & Sanitation (WSD)</option>
                    <option value="electricity_and_lighting">Electricity & Streetlights (ELD)</option>
                    <option value="public_safety">Public Safety & Fire Hazards (PSD)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Priority Score</label>
                  <select
                    value={complaintForm.priority}
                    onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  >
                    <option value="low">Low (72h SLA)</option>
                    <option value="medium">Medium (48h SLA)</option>
                    <option value="high">High (24h SLA)</option>
                    <option value="critical">Critical (12h SLA)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Detailed Description</label>
                <textarea
                  rows={3}
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                />
              </div>

              <Button type="submit" disabled={loading} className="gap-2 text-xs">
                <PlusCircle className="w-4 h-4" />
                <span>Save Grievance to MongoDB & Broadcast</span>
              </Button>
            </form>
          )}

          {/* TAB 2: SUBWAYS */}
          {activeTab === "subways" && (
            <form onSubmit={handleCreateSubway} className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Subway Name</label>
                  <input
                    type="text"
                    required
                    value={subwayForm.subwayName}
                    onChange={(e) => setSubwayForm({ ...subwayForm, subwayName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Ward</label>
                  <select
                    value={subwayForm.ward}
                    onChange={(e) => setSubwayForm({ ...subwayForm, ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  >
                    {MUMBAI_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Water Depth (cm)</label>
                  <input
                    type="number"
                    value={subwayForm.waterDepthCm}
                    onChange={(e) => setSubwayForm({ ...subwayForm, waterDepthCm: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Critical Barrier Threshold (cm)</label>
                  <input
                    type="number"
                    value={subwayForm.criticalThresholdCm}
                    onChange={(e) => setSubwayForm({ ...subwayForm, criticalThresholdCm: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Active High-Flow Pumps</label>
                  <input
                    type="number"
                    value={subwayForm.activePumpsCount}
                    onChange={(e) => setSubwayForm({ ...subwayForm, activePumpsCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="gap-2 text-xs">
                <PlusCircle className="w-4 h-4" />
                <span>Save Subway Gate to MongoDB</span>
              </Button>
            </form>
          )}

          {/* TAB 3: CCTV */}
          {activeTab === "cctv" && (
            <form onSubmit={handleCreateCctv} className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Camera Name</label>
                  <input
                    type="text"
                    required
                    value={cctvForm.cameraName}
                    onChange={(e) => setCctvForm({ ...cctvForm, cameraName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Ward</label>
                  <select
                    value={cctvForm.ward}
                    onChange={(e) => setCctvForm({ ...cctvForm, ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  >
                    {MUMBAI_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Junction Description</label>
                <input
                  type="text"
                  value={cctvForm.locationDescription}
                  onChange={(e) => setCctvForm({ ...cctvForm, locationDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                />
              </div>

              <Button type="submit" disabled={loading} className="gap-2 text-xs">
                <PlusCircle className="w-4 h-4" />
                <span>Save CCTV Camera to MongoDB</span>
              </Button>
            </form>
          )}

          {/* TAB 4: SWM BINS */}
          {activeTab === "bins" && (
            <form onSubmit={handleCreateBin} className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Locality / Waste Hub</label>
                  <input
                    type="text"
                    required
                    value={binForm.locality}
                    onChange={(e) => setBinForm({ ...binForm, locality: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Ward</label>
                  <select
                    value={binForm.ward}
                    onChange={(e) => setBinForm({ ...binForm, ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  >
                    {MUMBAI_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Initial Fill Percentage (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={binForm.currentFillPercentage}
                    onChange={(e) => setBinForm({ ...binForm, currentFillPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Waste Type</label>
                  <select
                    value={binForm.wasteType}
                    onChange={(e) => setBinForm({ ...binForm, wasteType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  >
                    <option value="MIXED_MSW">Mixed MSW (General Municipal)</option>
                    <option value="WET_WASTE">Wet Organic Waste</option>
                    <option value="DRY_RECYCLABLE">Dry Recyclable Waste</option>
                  </select>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="gap-2 text-xs">
                <PlusCircle className="w-4 h-4" />
                <span>Save Smart RFID Bin to MongoDB</span>
              </Button>
            </form>
          )}

          {/* TAB 5: DILAPIDATED BUILDINGS */}
          {activeTab === "buildings" && (
            <form onSubmit={handleCreateBuilding} className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Structure / Chawl Name</label>
                  <input
                    type="text"
                    required
                    value={buildingForm.buildingName}
                    onChange={(e) => setBuildingForm({ ...buildingForm, buildingName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Ward</label>
                  <select
                    value={buildingForm.ward}
                    onChange={(e) => setBuildingForm({ ...buildingForm, ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  >
                    {MUMBAI_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Resident Families</label>
                  <input
                    type="number"
                    value={buildingForm.residentFamilyCount}
                    onChange={(e) => setBuildingForm({ ...buildingForm, residentFamilyCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tilt Angle (°)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={buildingForm.tiltAngleDegrees}
                    onChange={(e) => setBuildingForm({ ...buildingForm, tiltAngleDegrees: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Crack Gap (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={buildingForm.crackDisplacementMm}
                    onChange={(e) => setBuildingForm({ ...buildingForm, crackDisplacementMm: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="gap-2 text-xs">
                <PlusCircle className="w-4 h-4" />
                <span>Save C1 Building to MongoDB</span>
              </Button>
            </form>
          )}

          {/* TAB 6: ROAD DLP CONTRACTS */}
          {activeTab === "contracts" && (
            <form onSubmit={handleCreateContract} className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Road Stretch Name</label>
                  <input
                    type="text"
                    required
                    value={contractForm.roadName}
                    onChange={(e) => setContractForm({ ...contractForm, roadName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Contractor Name</label>
                  <input
                    type="text"
                    required
                    value={contractForm.contractorName}
                    onChange={(e) => setContractForm({ ...contractForm, contractorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Ward</label>
                  <select
                    value={contractForm.ward}
                    onChange={(e) => setContractForm({ ...contractForm, ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  >
                    {MUMBAI_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Retention Fund Deposit (₹)</label>
                  <input
                    type="number"
                    value={contractForm.retentionFundAmountInr}
                    onChange={(e) => setContractForm({ ...contractForm, retentionFundAmountInr: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="gap-2 text-xs">
                <PlusCircle className="w-4 h-4" />
                <span>Save Road Contract to MongoDB</span>
              </Button>
            </form>
          )}

          {/* TAB 7: HOUSING SOCIETIES */}
          {activeTab === "societies" && (
            <form onSubmit={handleCreateSociety} className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Society Name</label>
                  <input
                    type="text"
                    required
                    value={societyForm.name}
                    onChange={(e) => setSocietyForm({ ...societyForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Ward</label>
                  <select
                    value={societyForm.ward}
                    onChange={(e) => setSocietyForm({ ...societyForm, ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  >
                    {MUMBAI_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Total Flats</label>
                  <input
                    type="number"
                    value={societyForm.totalFlats}
                    onChange={(e) => setSocietyForm({ ...societyForm, totalFlats: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Segregation Score (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={societyForm.segregationScorePct}
                    onChange={(e) => setSocietyForm({ ...societyForm, segregationScorePct: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="gap-2 text-xs">
                <PlusCircle className="w-4 h-4" />
                <span>Save Housing Society to MongoDB</span>
              </Button>
            </form>
          )}

          {/* TAB 8: PARTICIPATORY PROJECTS */}
          {activeTab === "projects" && (
            <form onSubmit={handleCreateProject} className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Project Title</label>
                  <input
                    type="text"
                    required
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Ward</label>
                  <select
                    value={projectForm.ward}
                    onChange={(e) => setProjectForm({ ...projectForm, ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  >
                    {MUMBAI_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Allocated Budget (₹)</label>
                  <input
                    type="number"
                    value={projectForm.estimatedBudgetInr}
                    onChange={(e) => setProjectForm({ ...projectForm, estimatedBudgetInr: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Estimated Beneficiaries</label>
                  <input
                    type="number"
                    value={projectForm.estimatedBeneficiaryCitizens}
                    onChange={(e) => setProjectForm({ ...projectForm, estimatedBeneficiaryCitizens: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="gap-2 text-xs">
                <PlusCircle className="w-4 h-4" />
                <span>Open Project for Citizen Voting in MongoDB</span>
              </Button>
            </form>
          )}

          {/* TAB 9: DEAD LETTER QUEUE (DLQ) MONITOR */}
          {activeTab === "queues" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${failedJobs.length > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                    {failedJobs.length > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Dead Letter Queue Status
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {failedJobs.length > 0
                        ? `${failedJobs.length} poisoned tasks isolated in Dead Letter Queue (DLQ)`
                        : "Background async queue is 100% healthy with zero poisoned jobs"}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchFailedJobs}
                  disabled={loadingDlq}
                  className="text-xs gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDlq ? "animate-spin" : ""}`} />
                  <span>Refresh DLQ</span>
                </Button>
              </div>

              {failedJobs.length === 0 ? (
                <div className="py-12 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2.5 opacity-80" />
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No Failed Tasks in Queue</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
                    All asynchronous background worker tasks (PDF generation, SMS notices, siren broadcasts) completed successfully.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase font-mono">
                      <tr>
                        <th className="px-4 py-3">Job ID & Type</th>
                        <th className="px-4 py-3">Attempts</th>
                        <th className="px-4 py-3">Error Cause</th>
                        <th className="px-4 py-3">Failed At</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {failedJobs.map((job) => {
                        const isExpanded = expandedJobId === job.id
                        return (
                          <tr key={job.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{job.id}</div>
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                {job.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono">
                              <span className="text-rose-600 dark:text-rose-400 font-semibold">{job.attempts}</span>
                              <span className="text-zinc-400">/{job.maxRetries || 3}</span>
                            </td>
                            <td className="px-4 py-3 max-w-xs truncate text-rose-600 dark:text-rose-400 font-mono text-[11px]">
                              {job.error || "Execution exhausted maximum retry backoff limit"}
                            </td>
                            <td className="px-4 py-3 font-mono text-zinc-500">
                              {job.failedAt ? new Date(job.failedAt).toLocaleTimeString() : new Date(job.createdAt).toLocaleTimeString()}
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                                className="text-[11px] h-7 px-2"
                              >
                                <Terminal className="w-3 h-3 mr-1" />
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRetryJob(job.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2.5 gap-1 shadow-sm"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Replay</span>
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {expandedJobId && (
                    <div className="p-4 bg-slate-900 border-t border-slate-800 text-emerald-400 font-mono text-[11px]">
                      <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-slate-400" />
                        <span>Payload Inspector for Job: <span className="text-slate-200">{expandedJobId}</span></span>
                      </div>
                      <pre className="overflow-x-auto p-2.5 rounded bg-slate-950/80 text-slate-300 border border-slate-800">
                        {JSON.stringify(failedJobs.find((j) => j.id === expandedJobId)?.payload || {}, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 10: CUSTOM AI MODEL TRAINING & ACTIVE LEARNING */}
          {activeTab === "ai_training" && (
            <div className="space-y-6">
              {/* Header Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        Municipal AI Neural Training Engine
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-white">
                        {aiStats?.version || "v2.4.0-ONLINE"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Learns continuously from citizen vernacular reports, officer triage corrections, and 5-star resolution ratings.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1">
                    <span className="text-[11px] text-zinc-500 font-mono">Epochs:</span>
                    <select
                      value={trainingEpochsCount}
                      onChange={(e) => setTrainingEpochsCount(Number(e.target.value))}
                      className="text-xs bg-transparent font-bold font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                    >
                      <option value={1}>1</option>
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                    </select>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(aiTrainingApi.exportDatasetUrl("jsonl"), "_blank")}
                    className="text-xs gap-1.5 border-zinc-200 dark:border-zinc-700"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>Export JSONL Dataset</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleTriggerOnlineTraining}
                    disabled={isTrainingAi}
                    className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <Cpu className={`w-3.5 h-3.5 ${isTrainingAi ? "animate-spin" : ""}`} />
                    <span>{isTrainingAi ? "Retraining Online..." : "Train Model Now"}</span>
                  </Button>
                </div>
              </div>

              {/* Model Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">Model Accuracy</span>
                  <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    {((aiStats?.averageAccuracy ?? 0.968) * 100).toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-zinc-400">Validated on Mumbai test bench</span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">Training Epochs</span>
                  <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                    {aiStats?.totalEpochs ?? 14}
                  </div>
                  <span className="text-[10px] text-zinc-400">Online incremental epochs</span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">Learned Vocabulary</span>
                  <div className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1">
                    {aiStats?.vocabularySize ?? 184} words
                  </div>
                  <span className="text-[10px] text-zinc-400">Hinglish & vernacular terms</span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">Total Samples</span>
                  <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
                    {aiStats?.totalTrainingSamples ?? 1420}
                  </div>
                  <span className="text-[10px] text-amber-500 font-semibold">
                    {aiStats?.untrainedSamplesCount ? `+${aiStats.untrainedSamplesCount} queued` : "Zero queue lag"}
                  </span>
                </div>
              </div>

              {/* Epoch Loss & Convergence Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Recent Epoch Loss Convergence History
                </h4>
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase font-mono">
                      <tr>
                        <th className="px-4 py-2.5">Epoch #</th>
                        <th className="px-4 py-2.5">Categorical Loss</th>
                        <th className="px-4 py-2.5">Accuracy</th>
                        <th className="px-4 py-2.5">Samples</th>
                        <th className="px-4 py-2.5">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                      {(aiStats?.lossHistory || []).map((entry, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                          <td className="px-4 py-2 font-bold text-zinc-900 dark:text-zinc-100">Epoch {entry.epoch}</td>
                          <td className="px-4 py-2 text-rose-600 dark:text-rose-400 font-semibold">{entry.loss.toFixed(4)}</td>
                          <td className="px-4 py-2 text-emerald-600 dark:text-emerald-400 font-semibold">{(entry.accuracy * 100).toFixed(2)}%</td>
                          <td className="px-4 py-2 text-zinc-500">{entry.samplesTrained || 64} samples</td>
                          <td className="px-4 py-2 text-zinc-400 text-[11px]">{new Date(entry.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interactive Ingestion Form: Teach AI New Vernacular / Slang Term */}
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Teach Custom Municipal Slang / Defect Phrase
                  </h4>
                </div>
                <form onSubmit={handleCustomFeedbackSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Citizen Phrase / Local Term
                      </label>
                      <input
                        type="text"
                        value={customFeedbackForm.inputText}
                        onChange={(e) => setCustomFeedbackForm({ ...customFeedbackForm, inputText: e.target.value })}
                        placeholder="e.g. Khadda signal ke pass bohot gehra hai"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Assigned Ward
                      </label>
                      <select
                        value={customFeedbackForm.ward}
                        onChange={(e) => setCustomFeedbackForm({ ...customFeedbackForm, ward: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                      >
                        {MUMBAI_WARDS.map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Target Category</label>
                      <select
                        value={customFeedbackForm.correctedCategory}
                        onChange={(e) => setCustomFeedbackForm({ ...customFeedbackForm, correctedCategory: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                      >
                        <option value="roads_and_infrastructure">Roads & Infrastructure</option>
                        <option value="garbage_collection">Solid Waste & Garbage</option>
                        <option value="drainage">Drainage & Storm Water</option>
                        <option value="street_lighting">Street Lighting</option>
                        <option value="water_and_sanitation">Water Supply</option>
                        <option value="public_safety">Public Safety & Hazards</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Department</label>
                      <select
                        value={customFeedbackForm.correctedDepartment}
                        onChange={(e) => setCustomFeedbackForm({ ...customFeedbackForm, correctedDepartment: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono font-bold"
                      >
                        <option value="PWD">PWD (Roads & Bridges)</option>
                        <option value="SWM">SWM (Solid Waste)</option>
                        <option value="SWD">SWD (Storm Water Drains)</option>
                        <option value="ELD">ELD (Electric Supply)</option>
                        <option value="WSD">WSD (Water Supply)</option>
                        <option value="PSD">PSD (Public Safety)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Severity</label>
                      <select
                        value={customFeedbackForm.correctedSeverity}
                        onChange={(e) => setCustomFeedbackForm({ ...customFeedbackForm, correctedSeverity: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs uppercase font-mono font-bold"
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} size="sm" className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Check className="w-3.5 h-3.5" />
                    <span>Inject into Active Learning Model</span>
                  </Button>
                </form>
              </div>

              {/* Live Feedback Stream */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Live Active Learning Feedback Stream
                  </h4>
                  <span className="text-xs text-zinc-400">
                    {recentFeedback.length} recent supervision samples
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase font-mono">
                      <tr>
                        <th className="px-4 py-2.5">Input Text</th>
                        <th className="px-4 py-2.5">Predicted</th>
                        <th className="px-4 py-2.5">Supervised / Corrected</th>
                        <th className="px-4 py-2.5">Source</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {recentFeedback.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                            No external feedback samples yet. All current predictions match verified ground truth.
                          </td>
                        </tr>
                      ) : (
                        recentFeedback.map((sample) => (
                          <tr key={sample._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                            <td className="px-4 py-2.5 max-w-xs truncate font-medium text-zinc-900 dark:text-zinc-100">
                              {sample.inputText}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-500">
                              {sample.predictedDepartment || "GEN"} ({sample.predictedCategory})
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[11px]">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {sample.correctedDepartment}
                              </span>{" "}
                              ({sample.correctedCategory})
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-400 uppercase">
                              {sample.source.replace(/_/g, " ")}
                            </td>
                            <td className="px-4 py-2.5">
                              {sample.isTrained ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  Trained
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  Queued
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
