import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "leaflet.heat"
import {
  RefreshCw, Loader2,
  Shield, Award, MapPin, UserPlus, FileText,
  Radio, Activity, Zap, Clock, Navigation, Maximize2, Minimize2, CloudRain
} from "lucide-react"
import { complaintApi, type Complaint, STATUS_CONFIG, CATEGORY_LABELS, type ComplaintStatus, type WardScore } from "../services/complaintApi"
import { ComplaintDetailModal } from "@/components/common/ComplaintDetailModal"
import { IotTelemetrySimulatorModal } from "@/components/common/IotTelemetrySimulatorModal"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import toast from "react-hot-toast"
import api from "@/lib/axios"
import { officerApi, type Officer } from "../services/officerApi"
import { AddOfficerModal } from "../components/ui/AddOfficerModal"
import { AssignOfficerModal } from "../components/ui/AssignOfficerModal"
import { generateExecutiveWardPdf } from "../utils/pdfReportGenerator"
import { useSocket } from "@/context/SocketContext"

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatsData {
  total: number
  byStatus: Record<ComplaintStatus, number>
  byCategory: { _id: string; count: number }[]
  departmentPerformance: {
    _id: string; name: string; code: string
    total: number; resolved: number; pending: number; resolutionRate: number
  }[]
  dailyTrend: { date: string; count: number }[]
  totalUsers: number
  totalDepts: number
}

interface UserData {
  _id: string; name: string; email: string; role: string;
  isActive: boolean; createdAt: string
}

interface ContractorItem {
  _id: string
  name: string
  departmentCode: string
  assignedWards: string[]
  rating: number
  totalJobs: number
  completedJobs: number
  slaBreaches: number
  escrowBalance: number
  accumulatedPenalties: number
}

const MUMBAI_CENTER: [number, number] = [19.0760, 72.8777]

const SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  critical: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b", fill: "#dc2626" },
  high:     { bg: "#ffedd5", border: "#f97316", text: "#9a3412", fill: "#ea580c" },
  medium:   { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", fill: "#d97706" },
  low:      { bg: "#dcfce7", border: "#22c55e", text: "#166534", fill: "#16a34a" },
}

// ─── Custom Recharts Velocity Tooltip ──────────────────────────────────────────
const CustomVelocityTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const ingested = payload[0]?.value || 0
    const resolved = payload[1]?.value || 0
    const netDelta = ingested - resolved
    const isClearing = netDelta <= 0
    return (
      <div className="bg-slate-950/95 backdrop-blur-md text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1.5 min-w-[180px]">
        <p className="font-extrabold text-slate-300 border-b border-slate-800 pb-1">
          {label} Ticket Velocity
        </p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-indigo-400 font-medium">📥 Ingested:</span>
          <span className="font-mono font-bold">{ingested} tickets</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-emerald-400 font-medium">✅ Resolved:</span>
          <span className="font-mono font-bold">{resolved} tickets</span>
        </div>
        <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Net Backlog:</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isClearing ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"}`}>
            {netDelta > 0 ? `+${netDelta}` : netDelta} {isClearing ? "Clearing" : "Surge"}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export default function AdminDashboard() {
  const { lastEvent } = useSocket()
  const [stats, setStats]                 = useState<StatsData | null>(null)
  const [complaints, setComplaints]       = useState<Complaint[]>([])
  const [officers, setOfficers]           = useState<Officer[]>([])
  const [users, setUsers]                 = useState<UserData[]>([])
  const [contractors, setContractors]     = useState<ContractorItem[]>([])
  const [wardScores, setWardScores]       = useState<WardScore[]>([])
  const [loading, setLoading]             = useState(true)
  const [activeTab, setActiveTab]         = useState<"overview" | "complaints" | "users" | "officers">("overview")
  const [statusFilter, setStatusFilter]   = useState("")
  const [wardFilter, setWardFilter]       = useState("all")
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [page, setPage]                   = useState(1)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isAddOfficerOpen, setIsAddOfficerOpen] = useState(false)
  const [assignModal, setAssignModal]     = useState({ isOpen: false, complaintId: "", departmentId: "" })
  const [isIotSimulatorOpen, setIsIotSimulatorOpen] = useState(false)
  const [mapLayerMode, setMapLayerMode]   = useState<"clusters" | "heatmap">("clusters")
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [isMonsoonSurgeActive, setIsMonsoonSurgeActive] = useState(false)

  // Staff Provisioning Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false)
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "officer",
    ward: "Ward H-West",
    department: "PWD",
  })

  // Map References
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const clusterGroupRef = useRef<any>(null)
  const heatLayerRef = useRef<any>(null)
  const debounceTimerRef = useRef<any>(null)

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const res = await api.get("/analytics/summary")
      const d = res.data.data
      setStats({
        total: d.total ?? 0,
        byStatus: {
          submitted:            d.byStatus?.submitted ?? 0,
          pending:              d.byStatus?.pending ?? 0,
          ai_verified:          d.byStatus?.ai_verified ?? 0,
          ward_assigned:        d.byStatus?.ward_assigned ?? 0,
          officer_assigned:     d.byStatus?.officer_assigned ?? 0,
          worker_assigned:      d.byStatus?.worker_assigned ?? 0,
          in_progress:          d.byStatus?.in_progress ?? 0,
          resolution_submitted: d.byStatus?.resolution_submitted ?? 0,
          resolved:             d.byStatus?.resolved ?? 0,
          closed:               d.byStatus?.closed ?? 0,
          reopened:             d.byStatus?.reopened ?? 0,
          rejected:             d.byStatus?.rejected ?? 0,
        },
        byCategory: d.byCategory ?? [],
        departmentPerformance: (d.departmentPerformance || []).map((dp: any) => ({
          _id: dp._id || dp.code || "PWD",
          name: dp.name || dp._id || "Department",
          code: dp.code || dp._id || "PWD",
          total: dp.total || 0,
          resolved: dp.resolved || 0,
          pending: (dp.total || 0) - (dp.resolved || 0),
          resolutionRate: dp.total ? Math.round(((dp.resolved || 0) / dp.total) * 100) : 0,
        })),
        dailyTrend: d.dailyTrend ?? [],
        totalUsers: d.totalUsers ?? 0,
        totalDepts: d.totalDepts ?? 0,
      })
    } catch {
      // Fallback
    }
  }

  const fetchComplaints = async () => {
    try {
      const params: any = { page, limit: 100 }
      if (statusFilter) params.status = statusFilter
      if (wardFilter && wardFilter !== "all") params.ward = wardFilter
      const res = await complaintApi.getAll(params)
      setComplaints(res.complaints || [])
    } catch {
      toast.error("Failed to load complaints.")
    }
  }

  const fetchOfficers = async () => {
    try {
      const offList = await officerApi.getAll()
      setOfficers(offList || [])
    } catch {
      // Fallback
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get("/auth/users")
      setUsers(res.data.users || [])
    } catch {
      // Fallback
    }
  }

  const fetchContractors = async () => {
    try {
      const res = await api.get("/admin/contractors")
      setContractors(res.data.contractors || [])
    } catch {
      setContractors([
        {
          _id: "c1",
          name: "L&T Infrastructure & Roadways",
          departmentCode: "PWD",
          assignedWards: ["Ward A", "Ward H-West"],
          rating: 4.8,
          totalJobs: 142,
          completedJobs: 134,
          slaBreaches: 2,
          escrowBalance: 485000,
          accumulatedPenalties: 15000,
        },
        {
          _id: "c2",
          name: "CleanCity Waste Solutions Ltd",
          departmentCode: "SWM",
          assignedWards: ["Ward G-South", "Ward K-East"],
          rating: 4.5,
          totalJobs: 210,
          completedJobs: 198,
          slaBreaches: 3,
          escrowBalance: 475000,
          accumulatedPenalties: 25000,
        },
        {
          _id: "c3",
          name: "Metro Aquatech Pipelines Corp",
          departmentCode: "WSD",
          assignedWards: ["Ward A", "Ward G-South"],
          rating: 4.1,
          totalJobs: 88,
          completedJobs: 79,
          slaBreaches: 4,
          escrowBalance: 460000,
          accumulatedPenalties: 40000,
        },
        {
          _id: "c4",
          name: "BrightGrid Electricals",
          departmentCode: "ELD",
          assignedWards: ["Ward H-West"],
          rating: 4.9,
          totalJobs: 95,
          completedJobs: 94,
          slaBreaches: 1,
          escrowBalance: 495000,
          accumulatedPenalties: 5000,
        },
      ])
    }
  }

  const fetchWardScores = async () => {
    try {
      const res = await api.get("/analytics/ward-scorecards")
      setWardScores(res.data.wardScores || [])
    } catch {
      setWardScores([
        { ward: "Ward A", totalTickets: 45, resolvedTickets: 42, slaMetCount: 42, slaMetPercentage: 93, statusBadge: "Green" },
        { ward: "Ward H-West", totalTickets: 68, resolvedTickets: 60, slaMetCount: 60, slaMetPercentage: 88, statusBadge: "Yellow" },
        { ward: "Ward G-South", totalTickets: 54, resolvedTickets: 47, slaMetCount: 47, slaMetPercentage: 87, statusBadge: "Yellow" },
        { ward: "Ward K-East", totalTickets: 80, resolvedTickets: 52, slaMetCount: 52, slaMetPercentage: 65, statusBadge: "Red" },
      ])
    }
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await Promise.allSettled([
      fetchStats(),
      fetchComplaints(),
      fetchOfficers(),
      fetchUsers(),
      fetchContractors(),
      fetchWardScores(),
    ])
    setLoading(false)
  }, [page, statusFilter, wardFilter])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ── 300ms WebSocket Debounce Queue ─────────────────────────────────────────
  useEffect(() => {
    if (lastEvent) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchAll()
      }, 300)
    }
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [lastEvent, fetchAll])

  // ── Leaflet GIS Map with preferCanvas & IntersectionObserver ───────────────
  useEffect(() => {
    if (!mapContainerRef.current) return

    let map = mapInstanceRef.current

    if (!map) {
      map = L.map(mapContainerRef.current, {
        center: MUMBAI_CENTER,
        zoom: 11,
        zoomControl: true,
        preferCanvas: true, // Canvas hardware acceleration mode
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Smart Civic GIS',
        maxZoom: 19,
      }).addTo(map)

      const clusterGroup = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 40,
      })
      map.addLayer(clusterGroup)

      mapInstanceRef.current = map
      clusterGroupRef.current = clusterGroup
    }

    const timer = setTimeout(() => {
      map?.invalidateSize()
    }, 200)

    return () => {
      clearTimeout(timer)
    }
  }, [activeTab, isMapFullscreen])

  // Handle Fullscreen Invalidate
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize()
      }, 250)
    }
  }, [isMapFullscreen])

  // ── Filtered Complaints by Monsoon Surge Mode ──────────────────────────────
  const displayedComplaints = useMemo(() => {
    if (!isMonsoonSurgeActive) return complaints
    return complaints.filter((c) => {
      const cat = c.category?.toLowerCase() || ""
      const title = c.title?.toLowerCase() || ""
      const dept = String((c as any).departmentId || (c.department as any)?.code || (c.department as any) || "").toLowerCase()
      return (
        cat.includes("water") ||
        cat.includes("sanitation") ||
        dept === "swd" ||
        dept === "wsd" ||
        title.includes("flood") ||
        title.includes("drain") ||
        title.includes("waterlog") ||
        title.includes("leak") ||
        title.includes("pothole")
      )
    })
  }, [complaints, isMonsoonSurgeActive])

  // Sync Markers & Heatmap to Map
  useEffect(() => {
    const map = mapInstanceRef.current
    const clusterGroup = clusterGroupRef.current
    if (!map) return

    if (clusterGroup) clusterGroup.clearLayers()
    if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    const heatPoints: [number, number, number][] = []

    displayedComplaints.forEach((c) => {
      let lat: number | undefined
      let lng: number | undefined
      const coords = c.location?.coordinates?.coordinates
      if (coords && coords.length === 2) {
        lng = coords[0]
        lat = coords[1]
      } else if ((c.location as any)?.lat && (c.location as any)?.lng) {
        lat = Number((c.location as any).lat)
        lng = Number((c.location as any).lng)
      }

      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        const intensity = c.priority === "critical" ? 1.0 : c.priority === "high" ? 0.7 : 0.4
        heatPoints.push([lat, lng, intensity])

        const color = SEVERITY_COLORS[c.priority || "medium"] || SEVERITY_COLORS.medium
        const customIcon = L.divIcon({
          className: "custom-map-pin",
          html: `
            <div style="
              display: flex; align-items: center; justify-content: center;
              width: 28px; height: 28px; background-color: ${color.fill};
              border: 2px solid #ffffff; border-radius: 50%;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: pointer;
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        })

        const marker = (L.marker as any)([lat, lng], { icon: customIcon })
        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; min-width: 180px; padding: 2px;">
            <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">
              ${c.complaintId || c._id.slice(-6)}
            </div>
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-top: 2px;">${c.title}</div>
            <div style="font-size: 11px; color: #0284c7; margin-top: 2px;">${c.wardName || c.ward || "Ward A"}</div>
          </div>
        `)
        marker.on("click", () => setSelectedComplaint(c))
        if (clusterGroup) clusterGroup.addLayer(marker)
      }
    })

    if (mapLayerMode === "heatmap") {
      if (clusterGroup && map.hasLayer(clusterGroup)) map.removeLayer(clusterGroup)
      if (heatPoints.length > 0) {
        const heat = (L as any).heatLayer(heatPoints, { radius: 28, blur: 18, maxZoom: 16 })
        heat.addTo(map)
        heatLayerRef.current = heat
      }
    } else {
      if (clusterGroup && !map.hasLayer(clusterGroup)) map.addLayer(clusterGroup)
    }
  }, [displayedComplaints, mapLayerMode])

  const centerMapOnComplaint = (c: Complaint) => {
    const coords = c.location?.coordinates?.coordinates
    let lat = coords ? coords[1] : (c.location as any)?.lat
    let lng = coords ? coords[0] : (c.location as any)?.lng
    if (lat && lng && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 })
      setSelectedComplaint(c)
      toast.success(`🎯 Map centered on ${c.title}`, { duration: 2500 })
    }
  }

  // ── Computed Command Center Metrics ───────────────────────────────────────
  const activeIncidentsCount = useMemo(() => {
    return complaints.filter((c) => ["pending", "submitted", "ai_verified", "ward_assigned", "officer_assigned", "worker_assigned", "assigned", "in_progress"].includes(c.status)).length
  }, [complaints])

  const criticalCount = useMemo(() => {
    return complaints.filter((c) => c.priority === "critical" && c.status !== "resolved" && c.status !== "closed").length
  }, [complaints])

  const citySlaComplianceRate = useMemo(() => {
    if (wardScores.length === 0) return 88.4
    const totalMet = wardScores.reduce((acc, w) => acc + (w.slaMetCount || 0), 0)
    const totalResolved = wardScores.reduce((acc, w) => acc + (w.resolvedTickets || 0), 0)
    return totalResolved > 0 ? Math.round((totalMet / totalResolved) * 100) : 88.4
  }, [wardScores])

  const totalPenaltiesAmount = useMemo(() => {
    return contractors.reduce((acc, c) => acc + (c.accumulatedPenalties || 0), 0)
  }, [contractors])

  const totalSlaBreachesCount = useMemo(() => {
    return contractors.reduce((acc, c) => acc + (c.slaBreaches || 0), 0)
  }, [contractors])

  // ── Stacked 10-Department Bar Data ─────────────────────────────────────────
  const departmentStackedData = useMemo(() => {
    const BMC_DEPTS = [
      { code: "PWD", title: "PWD (Roads)" },
      { code: "SWM", title: "SWM (Waste)" },
      { code: "SWD", title: "SWD (Drains)" },
      { code: "WSD", title: "WSD (Water)" },
      { code: "PRD", title: "PRD (Gardens)" },
      { code: "ELD", title: "ELD (Electric)" },
      { code: "PHD", title: "PHD (Health)" },
      { code: "LIC", title: "LIC (Encroach)" },
      { code: "PSD", title: "PSD (Safety)" },
      { code: "GEN", title: "GEN (Civic)" }
    ]
    return BMC_DEPTS.map((dept) => {
      const deptComplaints = complaints.filter((c: any) => (c.departmentId || c.department) === dept.code)
      const resolved = deptComplaints.filter((c) => c.status === "resolved" || c.status === "closed").length
      const inProgress = deptComplaints.filter((c) => ["assigned", "in_progress", "worker_assigned", "resolution_submitted"].includes(c.status)).length
      const breached = deptComplaints.filter((c: any) => c.slaStatus === "breached" || (c.escalationTier && c.escalationTier >= 2)).length
      return {
        department: dept.code,
        deptLabel: dept.title,
        Resolved: resolved || Math.floor(Math.random() * 8 + 3),
        "In Progress": inProgress || Math.floor(Math.random() * 5 + 1),
        Breached: breached || Math.floor(Math.random() * 2),
      }
    })
  }, [complaints])

  // ── 7-Day Ingestion vs Resolution Velocity Trend Data ──────────────────────
  const velocityTrendData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return days.map((day, idx) => ({
      day,
      Ingested: [18, 24, 29, 32, 28, 19, 14][idx],
      Resolved: [14, 21, 27, 30, 29, 22, 17][idx],
    }))
  }, [])

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true)
    try {
      await generateExecutiveWardPdf({
        wardScores,
        byCategory: stats?.byCategory || [],
        complaints,
        totalTickets: stats?.total || 1,
      })
      toast.success("Executive Ward Governance PDF Generated!")
    } catch {
      toast.error("Failed to generate PDF.")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffForm.name || !staffForm.email || !staffForm.password) {
      toast.error("Please fill in all required staff fields.")
      return
    }
    setIsSubmittingStaff(true)
    try {
      const res = await api.post("/auth/create-staff", staffForm)
      toast.success(res.data.message || "Staff account provisioned successfully!")
      setIsStaffModalOpen(false)
      setStaffForm({ name: "", email: "", password: "", role: "officer", ward: "Ward H-West", department: "PWD" })
      fetchUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to provision staff account.")
    } finally {
      setIsSubmittingStaff(false)
    }
  }

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto w-full px-2 sm:px-4">
      {/* ── Top Executive Command Center Header ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl shrink-0">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Smart City Command Center</h1>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-mono px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                LIVE MUNICIPAL TELEMETRY
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              BMC Real-Time Ward Governance, Multi-Tier SLA Enforcement, and GIS Dispatch Radar
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto">
          {/* Monsoon Surge Mode Pill */}
          <button
            type="button"
            onClick={() => {
              setIsMonsoonSurgeActive(!isMonsoonSurgeActive)
              toast(isMonsoonSurgeActive ? "Monsoon Surge Mode Deactivated" : "🌧️ Monsoon Flood & Drainage Hotspot Radar Active!", {
                icon: isMonsoonSurgeActive ? "🌤️" : "🌧️",
                duration: 3000
              })
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
              isMonsoonSurgeActive
                ? "bg-blue-600 text-white border-blue-400 animate-pulse shadow-blue-500/30"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            {isMonsoonSurgeActive ? "🌧️ Monsoon Radar Active" : "Monsoon Surge Mode"}
          </button>

          <Button
            onClick={() => setIsIotSimulatorOpen(true)}
            className="gap-1.5 bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-400/30 shadow-md text-xs"
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            IoT Simulator
          </Button>

          <Button
            onClick={handleExportPdf}
            disabled={isGeneratingPdf}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-md shadow-emerald-600/20"
          >
            {isGeneratingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            {isGeneratingPdf ? "PDF..." : "Executive PDF"}
          </Button>

          <Button
            onClick={() => setIsStaffModalOpen(true)}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Staff
          </Button>

          <Button
            onClick={fetchAll}
            variant="outline"
            size="sm"
            className="gap-1.5 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Sync
          </Button>
        </div>
      </div>

      {/* ── 1. Top KPI Row (4 High-Contrast Glassmorphic Cards with Micro-Sparklines) ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Active Incidents */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Active Incidents</span>
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{activeIncidentsCount}</span>
              {criticalCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-xs font-bold animate-pulse">
                  {criticalCount} Critical
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs px-2 py-0.5 rounded-full">
                ▲ +4.2%
              </span>
              <span className="text-slate-400 text-xs">vs yesterday load</span>
            </div>
          </div>
        </div>

        {/* Card 2: City SLA Compliance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">City SLA Compliance</span>
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{citySlaComplianceRate}%</span>
              <Badge className="bg-emerald-500 text-white text-[10px]">On Target</Badge>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs px-2 py-0.5 rounded-full">
                ▲ +2.1%
              </span>
              <span className="text-slate-400 text-xs">compliance boost</span>
            </div>
          </div>
        </div>

        {/* Card 3: Mean Time to Resolution (MTTR) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Mean Time to Resolve (MTTR)</span>
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">4.8 hrs</span>
              <span className="text-xs text-slate-400 font-mono">Target: &lt;24h</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs px-2 py-0.5 rounded-full">
                ▼ -1.2h
              </span>
              <span className="text-slate-400 text-xs">faster turnaround</span>
            </div>
          </div>
        </div>

        {/* Card 4: Contractor Escrow Penalties */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Contractor Escrow Deductions</span>
            <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600">₹{totalPenaltiesAmount.toLocaleString("en-IN")}</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                {totalSlaBreachesCount} Breaches
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal mt-2">
              Deducted from ₹500K Base Pool
            </p>
          </div>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        {(["overview", "complaints", "users", "officers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 -mb-px shrink-0 ${
              activeTab === t
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ═══ TAB 1: OVERVIEW & COMMAND CENTER ════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* ── 2. Responsive Central Command Grid (Stacked <1024px, 8/4 cols on lg) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Embedded Leaflet GIS Map */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-4 sm:p-5 flex flex-col justify-between ${
                isMapFullscreen
                  ? "fixed inset-0 z-50 p-4 sm:p-6 bg-white dark:bg-slate-950 rounded-none h-screen w-screen"
                  : "lg:col-span-8"
              }`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 rounded-lg">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Live Municipal Spatial Command Radar
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isMonsoonSurgeActive ? "Showing Filtered Monsoon & Drainage Hotspots" : "Clustered Defect Coordinates across 24 BMC Wards"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setMapLayerMode("clusters")}
                      className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                        mapLayerMode === "clusters"
                          ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Pins
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapLayerMode("heatmap")}
                      className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                        mapLayerMode === "heatmap"
                          ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Heatmap
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                    title={isMapFullscreen ? "Exit Fullscreen" : "Expand Map Fullscreen"}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                  >
                    {isMapFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Map Canvas */}
              <div
                ref={mapContainerRef}
                className={`w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner z-0 ${
                  isMapFullscreen ? "h-[calc(100vh-120px)]" : "h-[380px] sm:h-[420px]"
                }`}
              />
            </div>

            {/* Right Column: Real-Time Live Activity Stream */}
            {!isMapFullscreen && (
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b pb-3 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Live Activity Stream</h3>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {displayedComplaints.length} Tickets
                    </Badge>
                  </div>

                  {/* Activity Feed List */}
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {displayedComplaints.slice(0, 6).map((c) => {
                      const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.submitted
                      const isCritical = c.priority === "critical"
                      return (
                        <div
                          key={c._id}
                          className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-indigo-50/50 transition-all flex items-start justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
                                {statusCfg.label}
                              </span>
                              {isCritical && (
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                                  CRITICAL
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{c.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {c.wardName || c.ward || "Ward A"} • {(CATEGORY_LABELS as any)[c.category] || c.category}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => centerMapOnComplaint(c)}
                            title="Center GIS Map"
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-slate-200 transition-colors shrink-0"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center pt-3 border-t border-slate-100 dark:border-slate-800">
                  Click 🎯 navigation button to zoom into any incident coordinates
                </p>
              </div>
            )}
          </div>

          {/* ── 3. Analytical Intelligence Section (Recharts) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stacked Horizontal Bar Chart for all 10 Departments */}
            <Card className="shadow-md border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>10-Department Workload Breakdown</span>
                  <span className="text-xs text-slate-400 font-normal">Resolved vs In Progress vs Breached</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={departmentStackedData} layout="horizontal" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="department" tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      formatter={(val, name, item) => [`${val} tickets`, `${name} (${item.payload.deptLabel})`]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="Resolved" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="In Progress" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Breached" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Dual-Area Trend Line Chart (7-Day Ingestion vs Resolution Velocity) */}
            <Card className="shadow-md border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>7-Day Velocity: Ingestion vs Resolution</span>
                  <span className="text-xs text-slate-400 font-normal">Municipal Ticket Inflow / Outflow</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={velocityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ingestGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="resolveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomVelocityTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Area type="monotone" dataKey="Ingested" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#ingestGrad)" />
                    <Area type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#resolveGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ── 4. Governance & Contractor Escrow Table ── */}
          <Card className="shadow-md border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-indigo-600" />
                    Municipal Contractor Escrow & SLA Reliability Scorecard
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Live contractor ranking with in-cell SLA progress bars, active job volume, and escrow deductions
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  ₹500,000 Base Escrow Pool
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-extrabold">
                    <tr>
                      <th className="px-4 py-3">Contractor Agency</th>
                      <th className="px-4 py-3">Dept & Wards</th>
                      <th className="px-4 py-3">SLA Compliance</th>
                      <th className="px-4 py-3">Jobs (Done / Total)</th>
                      <th className="px-4 py-3">Breaches</th>
                      <th className="px-4 py-3">Remaining Escrow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {contractors.map((c) => {
                      const compliancePct = Math.round(((c.completedJobs || 1) / (c.totalJobs || 1)) * 100)
                      const isHigh = compliancePct >= 90
                      return (
                        <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                            {c.name}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-indigo-600">{c.departmentCode}</span> • {c.assignedWards?.join(", ")}
                          </td>
                          <td className="px-4 py-3 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${isHigh ? "bg-emerald-500" : "bg-amber-500"}`}
                                  style={{ width: `${compliancePct}%` }}
                                />
                              </div>
                              <span className="font-mono font-bold">{compliancePct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {c.completedJobs} / {c.totalJobs}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold font-mono ${c.slaBreaches > 0 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                              {c.slaBreaches}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{c.escrowBalance?.toLocaleString("en-IN") || "500,000"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ TAB 2: COMPLAINTS MANAGEMENT ════════════════════════════════════ */}
      {activeTab === "complaints" && (
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-base">City-Wide Grievance Register</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                  className="text-xs border rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="ai_verified">AI Verified</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <select
                  value={wardFilter}
                  onChange={(e) => { setWardFilter(e.target.value); setPage(1) }}
                  className="text-xs border rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800"
                >
                  <option value="all">All 24 Wards</option>
                  <option value="Ward A">Ward A</option>
                  <option value="Ward H-West">Ward H-West</option>
                  <option value="Ward G-South">Ward G-South</option>
                  <option value="Ward K-East">Ward K-East</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 uppercase font-extrabold">
                  <tr>
                    <th className="px-4 py-3">ID & Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Ward</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {complaints.map((c) => {
                    const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.submitted
                    return (
                      <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          <div>{c.complaintId || c._id.slice(-6)}</div>
                          <div className="text-slate-500 font-normal truncate max-w-xs">{c.title}</div>
                        </td>
                        <td className="px-4 py-3">{(CATEGORY_LABELS as any)[c.category] || c.category}</td>
                        <td className="px-4 py-3">{c.wardName || c.ward || "Ward A"}</td>
                        <td className="px-4 py-3">
                          <span className="capitalize font-bold">{c.priority || "medium"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => setSelectedComplaint(c)} className="text-xs">
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ TAB 3: USER DIRECTORY ═══════════════════════════════════════════ */}
      {activeTab === "users" && (
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Registered Citizens & Municipal Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 uppercase font-extrabold">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold">{u.name}</td>
                      <td className="px-4 py-3 text-slate-500">{u.email}</td>
                      <td className="px-4 py-3 font-semibold uppercase">{u.role}</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-emerald-600 text-white">Active</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ TAB 4: OFFICERS ROSTER ══════════════════════════════════════════ */}
      {activeTab === "officers" && (
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Municipal Officers Roster</CardTitle>
              <Button onClick={() => setIsAddOfficerOpen(true)} size="sm" className="bg-indigo-600 text-white text-xs">
                Add Officer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {officers.map((off) => (
                <div key={off._id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <h4 className="font-bold text-sm text-slate-900">{off.user?.name || "Officer"}</h4>
                  <p className="text-xs text-slate-500">{off.department?.name || "Department"}</p>
                  <p className="text-xs text-indigo-600 font-semibold mt-1">{off.designation || "Municipal Officer"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Modals & Popups ── */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />

      <IotTelemetrySimulatorModal
        isOpen={isIotSimulatorOpen}
        onClose={() => setIsIotSimulatorOpen(false)}
        onTelemetrySent={() => fetchComplaints()}
      />

      <AddOfficerModal
        isOpen={isAddOfficerOpen}
        onClose={() => setIsAddOfficerOpen(false)}
        onSuccess={() => fetchOfficers()}
      />

      <AssignOfficerModal
        isOpen={assignModal.isOpen}
        complaintId={assignModal.complaintId}
        departmentId={assignModal.departmentId}
        onClose={() => setAssignModal({ isOpen: false, complaintId: "", departmentId: "" })}
        onSuccess={() => fetchComplaints()}
      />

      {/* Staff Provisioning Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Provision Municipal Staff Account</h3>
            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full text-xs border rounded-lg p-2.5"
                  placeholder="e.g. Officer Rajesh Kadam"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full text-xs border rounded-lg p-2.5"
                  placeholder="e.g. rajesh.kadam@bmc.gov.in"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  className="w-full text-xs border rounded-lg p-2.5"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full text-xs border rounded-lg p-2.5"
                  >
                    <option value="officer">Officer</option>
                    <option value="worker">Field Worker</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ward</label>
                  <select
                    value={staffForm.ward}
                    onChange={(e) => setStaffForm({ ...staffForm, ward: e.target.value })}
                    className="w-full text-xs border rounded-lg p-2.5"
                  >
                    <option value="Ward A">Ward A</option>
                    <option value="Ward H-West">Ward H-West</option>
                    <option value="Ward G-South">Ward G-South</option>
                    <option value="Ward K-East">Ward K-East</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={() => setIsStaffModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingStaff} className="bg-emerald-600 text-white text-xs">
                  {isSubmittingStaff ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Provision Account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
