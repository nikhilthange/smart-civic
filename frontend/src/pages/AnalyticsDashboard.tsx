import { useEffect, useState } from "react"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { Loader2, Activity, Clock, Bot, MapPin, AlertCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { analyticsApi, type AnalyticsData } from "@/services/analyticsApi"
import { CATEGORY_LABELS, type ComplaintCategory } from "@/services/complaintApi"

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await analyticsApi.getAnalytics()
      setData(res)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
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
  const formattedCategories = data.categories.map(c => ({
    name: CATEGORY_LABELS[c._id as ComplaintCategory] || c._id,
    value: c.count
  }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Deep dive into civic platform metrics</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Reports (30d)</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {data.trends.reduce((acc, curr) => acc + curr.count, 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Avg Resolution Time</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {data.resolutionStats.avgResolutionHours} <span className="text-lg font-normal text-slate-500">hrs</span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">AI Verification Accuracy</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {data.aiStats.accuracy}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Most Active Area</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 truncate max-w-[150px]">
                  {data.areas.length > 0 ? data.areas[0]._id : "N/A"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Trends Chart */}
        <Card className="glass-card md:col-span-2">
          <CardHeader>
            <CardTitle>Complaint Trends (Last 30 Days)</CardTitle>
            <CardDescription>Daily volume of reported issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} tickMargin={10} minTickGap={30} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any) => [val, "Complaints"]}
                  />
                  <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Categories Bar Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Most Reported Issues</CardTitle>
            <CardDescription>Top 10 categories by volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedCategories} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Areas Pie Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Area Wise Problems</CardTitle>
            <CardDescription>Distribution across cities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.areas}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="_id"
                  >
                    {data.areas.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
