import { useEffect, useState } from "react"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import { Loader2, Activity, Clock, Users, MapPin, AlertCircle, RefreshCw, Filter, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { analyticsApi, type AnalyticsData, type AnalyticsFilters } from "@/services/analyticsApi"
import { CATEGORY_LABELS, type ComplaintCategory } from "@/services/complaintApi"

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#0ea5e9", "#eab308"]

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
      setError(err.response?.data?.message || "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [filters]) // auto-apply filters on change

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }

  if (loading && !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-slate-600">{error || "No data available"}</p>
        <button onClick={fetchAnalytics} className="flex items-center gap-2 text-primary hover:underline">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    )
  }

  // Format category data
  const formattedCategories = data?.byCategory.map(c => ({
    name: CATEGORY_LABELS[c._id as ComplaintCategory] || c._id,
    value: c.count
  })) || []

  // Format department data
  const formattedDepts = data?.byDepartment.map(d => ({
    name: d._id,
    value: d.count
  })) || []

  // Format ward data
  const formattedWards = data?.byWard.map(w => ({
    name: w._id,
    value: w.count
  })) || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Deep dive into civic platform metrics</p>
        </div>
        <button onClick={fetchAnalytics} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-medium hover:bg-gray-50 self-start md:self-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-700">Filters</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <select name="status" value={filters.status} onChange={handleFilterChange} className="p-2 border rounded-md text-sm">
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
            <select name="priority" value={filters.priority} onChange={handleFilterChange} className="p-2 border rounded-md text-sm">
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select name="category" value={filters.category} onChange={handleFilterChange} className="p-2 border rounded-md text-sm">
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <select name="ward" value={filters.ward} onChange={handleFilterChange} className="p-2 border rounded-md text-sm">
              <option value="">All Wards</option>
              <option value="Ward A">Ward A</option>
              <option value="Ward G-South">Ward G-South</option>
              <option value="Ward H-West">Ward H-West</option>
              <option value="Ward K-East">Ward K-East</option>
              <option value="UNASSIGNED">UNASSIGNED</option>
            </select>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="p-2 border rounded-md text-sm" title="Start Date" />
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="p-2 border rounded-md text-sm" title="End Date" />
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {data && (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <p className="text-sm font-medium text-slate-500">Total Complaints</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{data.metrics.total}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between">
              <p className="text-sm font-medium text-amber-700">Pending / AI Verified</p>
              <p className="text-3xl font-bold text-amber-900 mt-1">{data.metrics.pending + data.metrics.aiVerified}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
              <p className="text-sm font-medium text-blue-700">Assigned / In Progress</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{data.metrics.wardAssigned + data.metrics.officerAssigned + data.metrics.inProgress}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between">
              <p className="text-sm font-medium text-emerald-700">Resolved</p>
              <p className="text-3xl font-bold text-emerald-900 mt-1">{data.metrics.resolved}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm flex flex-col justify-between">
              <p className="text-sm font-medium text-red-700">Critical Priority</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{data.metrics.critical}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Worker Workload (Avg / Max)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-slate-900">{data.workerStats.avgWorkload}</p>
                  <p className="text-sm text-slate-500">/ {data.workerStats.maxWorkload} active tasks</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Avg Resolution Time</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-slate-900">{data.resolutionStats.avgResolutionHours}</p>
                  <p className="text-sm text-slate-500">hours</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Complaint Volume Trend
                </CardTitle>
                <CardDescription>Daily reports over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="Complaints"
                        stroke="#4f46e5" 
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Complaints by Department
                </CardTitle>
                <CardDescription>Distribution across BMC departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedDepts} layout="vertical" margin={{ left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={80} />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="value" name="Complaints" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
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
                        paddingAngle={2}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {formattedCategories.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Complaints by Ward
                </CardTitle>
                <CardDescription>Geographic distribution of issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedWards}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="value" name="Complaints" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
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
