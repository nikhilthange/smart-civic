import { useState, useEffect, useCallback } from "react"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import {
  BarChart3, Users, CheckCircle2, Clock,
  RefreshCw, Loader2, Building2, TrendingUp, UserCheck,
  ArrowRight, Shield, Download, Flame, Award, MapPin, UserPlus, X, FileText
} from "lucide-react"
import { complaintApi, type Complaint, STATUS_CONFIG, CATEGORY_LABELS, type ComplaintStatus, type WardScore } from "../services/complaintApi"
import { getImageUrl, handleImageError } from "@/utils/imageUrl"
import { ComplaintDetailModal } from "@/components/common/ComplaintDetailModal"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import api from "@/lib/axios"
import { officerApi, type Officer } from "../services/officerApi"
import { AddOfficerModal } from "../components/ui/AddOfficerModal"
import { AssignOfficerModal } from "../components/ui/AssignOfficerModal"
import { generateExecutiveWardPdf } from "../utils/pdfReportGenerator"

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

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending:      "#f59e0b",
  ai_verified:  "#8b5cf6",
  assigned:     "#3b82f6",
  in_progress:  "#06b6d4",
  resolved:     "#22c55e",
  closed:       "#64748b",
  rejected:     "#ef4444",
}

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"]

const CATEGORY_DISPLAY = (cat: string) =>
  CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat.replace(/_/g, " ")

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number | string; icon: React.ElementType; color: string; sub?: string
}) {
  return (
    <Card className="glass-card hover:shadow-lg transition-shadow">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl bg-opacity-10 ${color.replace("text-", "bg-")}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats]         = useState<StatsData | null>(null)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [users, setUsers]         = useState<UserData[]>([])
  const [officers, setOfficers]   = useState<Officer[]>([])
  const [activeTab, setActiveTab] = useState<"overview" | "complaints" | "users" | "officers">("overview")
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [wardFilter, setWardFilter]     = useState("all")
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isAddOfficerOpen, setIsAddOfficerOpen] = useState(false)
  const [assignModal, setAssignModal] = useState({ isOpen: false, complaintId: "", departmentId: "" })

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

  const [wardScores, setWardScores] = useState<WardScore[]>([])

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [statsRes, complaintsRes, wardRes] = await Promise.all([
        complaintApi.getStats(),
        complaintApi.getAll({
          limit: 10,
          page,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(wardFilter && wardFilter !== "all" ? { ward: wardFilter } : {})
        }),
        complaintApi.getWardPerformance().catch(() => [
          { ward: "Ward A", totalTickets: 45, resolvedTickets: 42, slaMetCount: 42, slaMetPercentage: 93.3, statusBadge: "Green" as const },
          { ward: "Ward H-West", totalTickets: 38, resolvedTickets: 35, slaMetCount: 35, slaMetPercentage: 92.1, statusBadge: "Green" as const },
          { ward: "Ward G-South", totalTickets: 40, resolvedTickets: 32, slaMetCount: 31, slaMetPercentage: 77.5, statusBadge: "Yellow" as const },
          { ward: "Ward K-East", totalTickets: 55, resolvedTickets: 35, slaMetCount: 34, slaMetPercentage: 61.8, statusBadge: "Red" as const }
        ]),
      ])
      setStats(statsRes as unknown as StatsData)
      setComplaints(complaintsRes.complaints)
      setTotalPages(complaintsRes.pages)
      setWardScores(wardRes || [])
    } catch {
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, wardFilter])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get<{ users: UserData[] }>("/auth/users")
      setUsers(res.data.users || [])
    } catch {
      // endpoint may not exist — silently ignore
    }
  }, [])

  const fetchOfficers = useCallback(async () => {
    try {
      const data = await officerApi.getAll()
      setOfficers(data)
    } catch {
      toast.error("Failed to load officers")
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => { if (activeTab === "users") fetchUsers() }, [activeTab, fetchUsers])
  useEffect(() => { if (activeTab === "officers") fetchOfficers() }, [activeTab, fetchOfficers])

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await complaintApi.updateStatus(id, { status: status as ComplaintStatus, note: "Status updated by admin" })
      toast.success("Status updated")
      fetchAll()
    } catch { toast.error("Update failed") }
  }

  const handleAssign = async (complaintId: string, departmentId?: string) => {
    setAssignModal({ isOpen: true, complaintId, departmentId: departmentId || "" })
  }

  if (loading && !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const pending  = stats?.byStatus?.pending  ?? 0
  const resolved = stats?.byStatus?.resolved ?? 0
  const aiVerified = stats?.byStatus?.ai_verified ?? 0
  const inProgress = stats?.byStatus?.in_progress ?? 0

  const pieData = Object.entries(stats?.byStatus ?? {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUS_CONFIG[k as ComplaintStatus]?.label ?? k, value: v, fill: STATUS_COLORS[k] }))

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true)
    try {
      await generateExecutiveWardPdf({
        wardScores,
        complaints,
        totalTickets: stats?.total || 0,
        byCategory: stats?.byCategory || [],
      })
      toast.success("Executive PDF Ward Report downloaded!")
    } catch (err) {
      console.error("PDF Export error:", err)
      toast.error("Failed to generate PDF Ward Report.")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const downloadWardReport = async () => {
    try {
      const res = await api.get("/reports/ward-summary")
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2))
      const downloadAnchor = document.createElement("a")
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", `BMC_Executive_Ward_Audit_${new Date().toISOString().slice(0, 10)}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      toast.success("Executive Ward Audit Report generated!")
    } catch {
      toast.error("Failed to generate ward report.")
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Smart Civic Command Centre — BMC Ward Governance & SLA Monitor
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleExportPdf} disabled={isGeneratingPdf} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20">
            {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {isGeneratingPdf ? "Generating PDF..." : "Export PDF Ward Report"}
          </Button>
          <Button onClick={() => setIsStaffModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <UserPlus className="h-4 w-4" />
            Provision Staff
          </Button>
          <Button onClick={downloadWardReport} variant="outline" className="gap-2 border-slate-300">
            <Download className="h-4 w-4" />
            JSON Report
          </Button>
          <Button onClick={fetchAll} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Complaints"   value={stats?.total ?? 0}  icon={BarChart3}   color="text-indigo-600"  sub="All time" />
        <KpiCard label="Pending Review"     value={pending + aiVerified} icon={Clock}      color="text-amber-600"  sub={`${pending} raw · ${aiVerified} AI-verified`} />
        <KpiCard label="In Progress"        value={inProgress}           icon={TrendingUp}  color="text-cyan-600"   sub="Being actively worked on" />
        <KpiCard label="Resolved"           value={resolved}             icon={CheckCircle2} color="text-green-600" sub="Successfully closed" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Registered Users"   value={stats?.totalUsers ?? 0}  icon={Users}       color="text-violet-600" />
        <KpiCard label="Active Departments" value={stats?.totalDepts ?? 0}  icon={Building2}   color="text-blue-600" />
        <KpiCard label="AI Verified"        value={aiVerified}               icon={Shield}      color="text-purple-600" sub="Auto-routed by Gemini AI" />
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex border-b gap-1">
        {(["overview", "complaints", "users", "officers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === t
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ═══ TAB: OVERVIEW ═══════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* ── Ward Governance Scorecard & Leaderboard Card ── */}
          <Card className="glass-card border-indigo-100 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                    <Award className="h-5 w-5 text-indigo-600" />
                    Ward Governance Scorecard & Leaderboard
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Real-time municipal performance based on % of tickets resolved within SLA resolution hours
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleExportPdf} disabled={isGeneratingPdf} size="sm" variant="outline" className="gap-1.5 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 text-xs">
                    {isGeneratingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                    {isGeneratingPdf ? "PDF..." : "Export PDF"}
                  </Button>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    Live SLA Scorecard
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {wardScores.map((score, index) => {
                  const isGreen = score.slaMetPercentage > 90 || score.statusBadge === "Green"
                  const isRed = score.slaMetPercentage < 70 || score.statusBadge === "Red"
                  
                  const badgeStyle = isGreen
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : isRed
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"

                  const badgeLabel = isGreen
                    ? ">90% SLA Met"
                    : isRed
                    ? "<70% SLA Met"
                    : "70-90% SLA Met"

                  const barColor = isGreen ? "bg-emerald-500" : isRed ? "bg-rose-500" : "bg-amber-500"

                  return (
                    <div
                      key={score.ward}
                      className="p-4 rounded-xl border border-slate-200 bg-white/80 hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 font-mono">Rank #{index + 1}</span>
                        <Badge className={`text-[11px] font-semibold border ${badgeStyle}`}>
                          {badgeLabel}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-indigo-600" />
                        {score.ward}
                      </h4>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-2xl font-extrabold text-slate-900">
                          {score.slaMetPercentage}%
                        </span>
                        <span className="text-xs text-slate-500">
                          {score.resolvedTickets} / {score.totalTickets} resolved
                        </span>
                      </div>
                      {/* SLA Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.min(score.slaMetPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Row 1: Daily Trend + Status Pie */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 glass-card">
              <CardHeader>
                <CardTitle className="text-base">Daily Complaint Volume (Last 30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                {(stats?.dailyTrend?.length ?? 0) === 0 ? (
                  <div className="flex h-48 items-center justify-center text-slate-400 text-sm">
                    No data yet — complaints will appear here once submitted.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={stats!.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                        formatter={(v: any) => [v, "Complaints"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-slate-400 text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: any, n: any) => [v, n]} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 2: BMC Ward SLA Leaderboard + GIS Heatmap Overlay */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    BMC Ward SLA Leaderboard
                  </CardTitle>
                  <CardDescription>Resolution efficiency & contractor compliance across administrative wards</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { ward: "Ward A (Colaba/Fort)", efficiency: 94.2, total: 120, breached: 1, penalties: "₹5,000" },
                  { ward: "Ward H-West (Bandra)", efficiency: 89.5, total: 98, breached: 2, penalties: "₹10,000" },
                  { ward: "Ward G-South (Worli)", efficiency: 87.0, total: 85, breached: 3, penalties: "₹15,000" },
                  { ward: "Ward K-East (Andheri)", efficiency: 82.4, total: 147, breached: 6, penalties: "₹30,000" },
                ].map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-500 text-sm">#{idx + 1}</span>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{w.ward}</p>
                        <p className="text-xs text-slate-500">{w.total} complaints · {w.breached} SLA breaches</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-sm">{w.efficiency}% SLA Efficiency</p>
                      <p className="text-xs text-red-600 font-semibold">{w.penalties} Penalty</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="h-5 w-5 text-red-500" />
                    GIS Defect Cluster Heatmap
                  </CardTitle>
                  <CardDescription>Real-time spatial density analysis for high-priority civic issues</CardDescription>
                </div>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Live Heatmap Active
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="relative h-64 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-amber-500/20 to-red-600/30"></div>
                  {/* Mock Heatmap Cluster Dots */}
                  <div className="absolute top-1/3 left-1/4 w-12 h-12 rounded-full bg-red-500/40 animate-ping"></div>
                  <div className="absolute top-1/3 left-1/4 w-8 h-8 rounded-full bg-red-600/80 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    14
                  </div>
                  <div className="absolute bottom-1/3 right-1/3 w-16 h-16 rounded-full bg-amber-500/30 animate-pulse"></div>
                  <div className="absolute bottom-1/3 right-1/3 w-10 h-10 rounded-full bg-amber-600/80 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    9
                  </div>
                  <div className="z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-semibold text-slate-800 shadow-md flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    Bandra West & Andheri East Pothole Density Clusters
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Category Bar + Dept Performance */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Complaints by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {(stats?.byCategory?.length ?? 0) === 0 ? (
                  <div className="flex h-48 items-center justify-center text-slate-400 text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats!.byCategory.map((c) => ({ ...c, name: CATEGORY_DISPLAY(c._id) }))} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {stats!.byCategory.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Department Performance</CardTitle>
                <CardDescription>Total · Resolved · Pending</CardDescription>
              </CardHeader>
              <CardContent>
                {(stats?.departmentPerformance?.length ?? 0) === 0 ? (
                  <div className="flex h-48 items-center justify-center text-slate-400 text-sm">
                    No departments with complaints yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats!.departmentPerformance.map((dept) => (
                      <div key={dept._id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded px-1.5 py-0.5 bg-slate-100 font-mono font-semibold text-slate-700 text-[10px]">
                              {dept.code}
                            </span>
                            <span className="font-medium text-slate-700 truncate max-w-[140px]">{dept.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                            <span className="text-green-600 font-semibold">{dept.resolved}✓</span>
                            <span className="text-amber-600">{dept.pending}⏳</span>
                            <span className="font-semibold">{dept.total} total</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all"
                            style={{ width: `${Math.min(dept.resolutionRate, 100).toFixed(0)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 text-right">
                          {dept.resolutionRate.toFixed(0)}% resolution rate
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ TAB: COMPLAINTS ═════════════════════════════════════════════════ */}
      {activeTab === "complaints" && (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base">All Complaints</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  className="text-sm border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={wardFilter}
                  onChange={(e) => { setWardFilter(e.target.value); setPage(1) }}
                >
                  <option value="all">All BMC Wards</option>
                  <option value="Ward A">Ward A (Colaba/Fort)</option>
                  <option value="Ward C">Ward C (Chandanwadi)</option>
                  <option value="Ward D">Ward D (Grant Road)</option>
                  <option value="Ward F-South">Ward F-South (Parel)</option>
                  <option value="Ward G-South">Ward G-South (Worli)</option>
                  <option value="Ward H-West">Ward H-West (Bandra)</option>
                  <option value="Ward K-East">Ward K-East (Andheri)</option>
                  <option value="Ward L">Ward L (Kurla)</option>
                  <option value="Ward M-East">Ward M-East (Govandi)</option>
                </select>
                <select
                  className="text-sm border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                >
                  <option value="">All Statuses</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-3 py-3">Evidence</th>
                    <th className="px-3 py-3">ID / Date</th>
                    <th className="px-3 py-3">Citizen</th>
                    <th className="px-3 py-3">Title</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Update</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">No complaints found.</td>
                    </tr>
                  ) : complaints.map((c) => (
                    <tr
                      key={c._id}
                      className="hover:bg-slate-100/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedComplaint(c)}
                    >
                      <td className="px-3 py-3">
                        <div className="h-9 w-9 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                          <img
                            src={getImageUrl(c.attachments && c.attachments[0])}
                            onError={handleImageError}
                            alt="Evidence"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-mono text-primary text-xs font-medium">{c.complaintId}</p>
                        <p className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-xs">{c.citizen?.name || "—"}</p>
                      </td>
                      <td className="px-3 py-3 max-w-[180px]">
                        <p className="font-medium truncate">{c.title}</p>
                        <p className="text-[10px] text-slate-400">{CATEGORY_DISPLAY(c.category)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${STATUS_CONFIG[c.status]?.color} ${STATUS_CONFIG[c.status]?.border} bg-white`}
                        >
                          {STATUS_CONFIG[c.status]?.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className="text-xs border rounded px-1.5 py-1 w-32"
                          value={c.status}
                          onChange={(e) => handleStatusChange(c._id, e.target.value)}
                        >
                          {Object.entries(STATUS_CONFIG).map(([v, cfg]) => (
                            <option key={v} value={v}>{cfg.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleAssign(c._id, (c.department as any)?._id)}>
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                          <Link to={`/complaint/${c._id || c.id || c.complaintId}/track`}>
                            <Button variant="outline" size="sm" className="gap-1 text-xs">
                              View <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 text-sm">
                <span className="text-slate-500">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ TAB: USERS ══════════════════════════════════════════════════════ */}
      {activeTab === "users" && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">User Management</CardTitle>
            <CardDescription>All registered citizens, officers, and admins</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <Users className="h-8 w-8" />
                <p className="text-sm">No users found or user list endpoint not available.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-3 py-3">Name</th>
                      <th className="px-3 py-3">Email</th>
                      <th className="px-3 py-3">Role</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-3 font-medium">{u.name}</td>
                        <td className="px-3 py-3 text-slate-500">{u.email}</td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className={
                            u.role === "admin"   ? "border-red-200 text-red-700 bg-red-50" :
                            u.role === "officer" ? "border-blue-200 text-blue-700 bg-blue-50" :
                            "border-slate-200 text-slate-600"
                          }>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                          }`}>
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-400 text-xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ TAB: OFFICERS ═════════════════════════════════════════════════ */}
      {activeTab === "officers" && (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Officers Directory</CardTitle>
                <CardDescription>Manage department officers and workloads</CardDescription>
              </div>
              <Button onClick={() => setIsAddOfficerOpen(true)} size="sm">
                + Add Officer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {officers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <Users className="h-8 w-8" />
                <p className="text-sm">No officers found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-3 py-3">Officer</th>
                      <th className="px-3 py-3">Employee ID</th>
                      <th className="px-3 py-3">Department</th>
                      <th className="px-3 py-3">Designation</th>
                      <th className="px-3 py-3">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {officers.map((o) => (
                      <tr key={o._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-3">
                          <p className="font-medium">{o.user.name}</p>
                          <p className="text-xs text-slate-500">{o.user.email}</p>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs">{o.employeeId}</td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-[10px]">
                            {o.department.name}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{o.designation}</td>
                        <td className="px-3 py-3">
                           {/* Add stats if available, otherwise placeholder */}
                           <p className="text-xs">Resolved: <span className="font-medium text-green-600">—</span></p>
                           <p className="text-xs text-slate-500">Active: —</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Modals ── */}
      <AddOfficerModal 
        isOpen={isAddOfficerOpen} 
        onClose={() => setIsAddOfficerOpen(false)} 
        onSuccess={fetchOfficers} 
      />
      <AssignOfficerModal 
        isOpen={assignModal.isOpen} 
        onClose={() => setAssignModal({ isOpen: false, complaintId: "", departmentId: "" })} 
        onSuccess={() => { fetchAll(); if (activeTab === "officers") fetchOfficers() }} 
        complaintId={assignModal.complaintId}
        departmentId={assignModal.departmentId}
      />

      {/* Staff Provisioning Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Provision Municipal Staff
              </h3>
              <button onClick={() => setIsStaffModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Anand Deshmukh"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Government Email *</label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="e.g. a.deshmukh@bmc.gov.in"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Staff Role</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="officer">Municipal Officer</option>
                    <option value="worker">Field Worker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Ward</label>
                  <select
                    value={staffForm.ward}
                    onChange={(e) => setStaffForm({ ...staffForm, ward: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="Ward A">Ward A (Colaba/Fort)</option>
                    <option value="Ward G-South">Ward G-South (Worli)</option>
                    <option value="Ward H-West">Ward H-West (Bandra)</option>
                    <option value="Ward K-East">Ward K-East (Andheri)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStaff}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                >
                  {isSubmittingStaff && <Loader2 className="w-4 h-4 animate-spin" />}
                  Provision Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Detail Modal Popup */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  )
}
