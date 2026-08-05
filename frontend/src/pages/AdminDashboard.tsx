import { useState, useEffect, useCallback } from "react"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import {
  BarChart3, Users, CheckCircle2, Clock, AlertCircle,
  RefreshCw, Loader2, Building2, TrendingUp, UserCheck,
  ArrowRight, ChevronDown, Shield
} from "lucide-react"
import { complaintApi, type Complaint, STATUS_CONFIG, CATEGORY_LABELS, type ComplaintStatus } from "../services/complaintApi"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import api from "@/lib/axios"

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
    <Card className="hover:shadow-md transition-shadow">
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
  const [activeTab, setActiveTab] = useState<"overview" | "complaints" | "users">("overview")
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [statsRes, complaintsRes] = await Promise.all([
        complaintApi.getStats(),
        complaintApi.getAll({ limit: 10, page, ...(statusFilter ? { status: statusFilter } : {}) }),
      ])
      setStats(statsRes as unknown as StatsData)
      setComplaints(complaintsRes.complaints)
      setTotalPages(complaintsRes.pages)
    } catch {
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get<{ users: UserData[] }>("/auth/users")
      setUsers(res.data.users || [])
    } catch {
      // endpoint may not exist — silently ignore
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => { if (activeTab === "users") fetchUsers() }, [activeTab, fetchUsers])

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await complaintApi.updateStatus(id, { status: status as ComplaintStatus, note: "Status updated by admin" })
      toast.success("Status updated")
      fetchAll()
    } catch { toast.error("Update failed") }
  }

  const handleAssign = async (complaintId: string) => {
    // Placeholder — open modal in future iteration
    toast("Assign feature coming soon — link officer via the complaint detail page", { icon: "ℹ️" })
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

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Smart Civic command centre — real-time complaint metrics
          </p>
        </div>
        <Button onClick={fetchAll} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
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
        {(["overview", "complaints", "users"] as const).map((t) => (
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
          {/* Row 1: Daily Trend + Status Pie */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-sm">
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
                        formatter={(v: number) => [v, "Complaints"]}
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

            <Card className="shadow-sm">
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
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number, n: string) => [v, n]} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Category Bar + Dept Performance */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-sm">
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

            <Card className="shadow-sm">
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
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base">All Complaints</CardTitle>
              <div className="flex items-center gap-2">
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
                      <td colSpan={6} className="text-center py-10 text-slate-400">No complaints found.</td>
                    </tr>
                  ) : complaints.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
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
                          <Button variant="ghost" size="sm" onClick={() => handleAssign(c._id)}>
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                          <Link to={`/complaint/${c._id}/track`}>
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
        <Card className="shadow-sm">
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
    </div>
  )
}
