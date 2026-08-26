import { useEffect, useState } from "react"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import { Loader2, Activity, Clock, Users, MapPin, AlertCircle, RefreshCw, Filter, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { analyticsApi, type AnalyticsData, type AnalyticsFilters } from "@/services/analyticsApi"
import { CATEGORY_LABELS, type ComplaintCategory } from "@/services/complaintApi"

const COLORS = ["#10b981", "#0d9488", "#059669", "#14b8a6", "#34d399", "#2dd4bf", "#64748b", "#0f766e", "#047857", "#475569"]

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<AnalyticsFilters>({
    department: "",
    ward: "",
    category: "",
    priority: "",
    status: "",
    startDate: "",
    endDate: ""
  })

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await analyticsApi.getAnalytics(filters)
      setData(res)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load analytics telemetry")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [filters])

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  if (loading && !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <p className="text-slate-600 dark:text-slate-300 text-sm font-sans">{error || "No telemetry data available"}</p>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    )
  }

  // Format category data
  const formattedCategories = data?.byCategory.map(c => ({
    name: CATEGORY_LABELS[c._id as ComplaintCategory] || c._id || "Other",
    value: c.count
  })) || []

  // Format department data
  const formattedDepts = data?.byDepartment.map(d => ({
    name: d._id || "General",
    value: d.count
  })) || []

  // Format ward data
  const formattedWards = data?.byWard.map(w => ({
    name: w._id || "Unassigned",
    value: w.count
  })) || []

  const customTooltipStyle = {
    borderRadius: '12px',
    backdropFilter: 'blur(12px)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: '12px',
    fontFamily: 'JetBrains Mono',
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)'
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
            Analytics & Telemetry
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-sans">
            Deep dive into civic platform telemetry, department workloads, and municipal resolution velocity
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-950/[0.02] rounded-xl text-xs font-mono font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Telemetry
        </button>
      </div>

      {/* Telemetry Filters */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-950/[0.02]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-emerald-600" />
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Telemetry Filters
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="p-2 border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-800/80 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="ai_verified">AI Verified</option>
              <option value="ward_assigned">Ward Assigned</option>
              <option value="officer_assigned">Officer Assigned</option>
              <option value="worker_assigned">Worker Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolution_submitted">Proof Uploaded</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className="p-2 border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-800/80 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="p-2 border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-800/80 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <select
              name="ward"
              value={filters.ward}
              onChange={handleFilterChange}
              className="p-2 border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-800/80 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Wards</option>
              <option value="Ward A">Ward A</option>
              <option value="Ward G-South">Ward G-South</option>
              <option value="Ward H-West">Ward H-West</option>
              <option value="Ward K-East">Ward K-East</option>
              <option value="UNASSIGNED">UNASSIGNED</option>
            </select>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="p-2 border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-800/80 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
              title="Start Date"
            />
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="p-2 border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-800/80 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
              title="End Date"
            />
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {data && (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-950/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/[0.04] transition-all duration-200 flex flex-col justify-between">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-display">Total Complaints</p>
              <p className="font-mono tracking-tight font-bold text-3xl text-slate-900 dark:text-white font-tabular mt-2">{data.metrics.total}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-950/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/[0.04] transition-all duration-200 flex flex-col justify-between">
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-display">Pending / AI Verified</p>
              <p className="font-mono tracking-tight font-bold text-3xl text-amber-600 dark:text-amber-400 font-tabular mt-2">{data.metrics.pending + data.metrics.aiVerified}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-950/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/[0.04] transition-all duration-200 flex flex-col justify-between">
              <p className="text-xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 font-display">Assigned / In Progress</p>
              <p className="font-mono tracking-tight font-bold text-3xl text-teal-600 dark:text-teal-400 font-tabular mt-2">{data.metrics.wardAssigned + data.metrics.officerAssigned + data.metrics.inProgress}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-950/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/[0.04] transition-all duration-200 flex flex-col justify-between">
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-display">Resolved</p>
              <p className="font-mono tracking-tight font-bold text-3xl text-emerald-600 dark:text-emerald-400 font-tabular mt-2">{data.metrics.resolved}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-950/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/[0.04] transition-all duration-200 flex flex-col justify-between">
              <p className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-display">Critical Priority</p>
              <p className="font-mono tracking-tight font-bold text-3xl text-rose-600 dark:text-rose-400 font-tabular mt-2">{data.metrics.critical}</p>
            </div>
          </div>

          {/* Secondary Telemetry Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-950/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/[0.04] transition-all duration-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-display">Worker Workload (Avg / Max)</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="font-mono tracking-tight font-bold text-3xl text-slate-900 dark:text-white font-tabular">{data.workerStats.avgWorkload}</p>
                  <p className="text-xs text-slate-500 font-mono">/ {data.workerStats.maxWorkload} active tasks</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-950/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/[0.04] transition-all duration-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-display">Avg Resolution Time</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="font-mono tracking-tight font-bold text-3xl text-slate-900 dark:text-white font-tabular">{data.resolutionStats.avgResolutionHours}</p>
                  <p className="text-xs text-slate-500 font-mono">hours MTTR</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-950/[0.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  Complaint Volume Trend
                </CardTitle>
                <CardDescription>Daily reports over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                      <XAxis dataKey="_id" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Complaints"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: '#10b981' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-950/[0.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Layers className="h-5 w-5 text-teal-600" />
                  Complaints by Department
                </CardTitle>
                <CardDescription>Distribution across BMC departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedDepts} layout="vertical" margin={{ left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.6} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} fontFamily="JetBrains Mono" />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={80} fontFamily="JetBrains Mono" />
                      <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} contentStyle={customTooltipStyle} />
                      <Bar dataKey="value" name="Complaints" fill="#0d9488" radius={[0, 6, 6, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-950/[0.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  Issue Categories
                </CardTitle>
                <CardDescription>Most frequently reported problems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formattedCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {formattedCategories.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={customTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm shadow-slate-950/[0.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  Complaints by Ward
                </CardTitle>
                <CardDescription>Geographic distribution of issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedWards}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontFamily="JetBrains Mono" />
                      <YAxis stroke="#94a3b8" fontSize={11} fontFamily="JetBrains Mono" />
                      <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} contentStyle={customTooltipStyle} />
                      <Bar dataKey="value" name="Complaints" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
