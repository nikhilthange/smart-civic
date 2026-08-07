import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Activity, AlertTriangle, CheckCircle2, Clock, FileText,
  Bot, Plus, ArrowRight, Loader2, Bell
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/context/AuthContext"
import {
  complaintApi, STATUS_CONFIG, CATEGORY_LABELS,
  type Complaint, type ComplaintStatus
} from "@/services/complaintApi"

function StatusBadge({ status }: { status: ComplaintStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

interface Stats {
  total: number
  byStatus: Record<string, number>
}

export default function Dashboard() {
  const { user } = useAuth()
  const [recent, setRecent] = useState<Complaint[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await complaintApi.getAll({ page: 1, limit: 5 })
        setRecent(data.complaints)

        // Build stats from fetched data for citizen view
        const byStatus: Record<string, number> = {}
        data.complaints.forEach(c => {
          byStatus[c.status] = (byStatus[c.status] || 0) + 1
        })
        setStats({ total: data.total, byStatus })
      } catch {
        // fail silently on dashboard
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const pending   = (stats?.byStatus["pending"] || 0) + (stats?.byStatus["ai_verified"] || 0)
  const inProgress = (stats?.byStatus["assigned"] || 0) + (stats?.byStatus["in_progress"] || 0)
  const resolved   = stats?.byStatus["resolved"] || 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {greeting}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Here's a summary of your civic complaint activity.
          </p>
        </div>
        <Link to="/complaint/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Complaint
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Submissions</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : stats?.total ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">All time complaints</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-amber-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-amber-300" /> : pending}
            </div>
            <p className="text-xs text-slate-500 mt-1">Awaiting action</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-blue-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">In Progress</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-blue-300" /> : inProgress}
            </div>
            <p className="text-xs text-slate-500 mt-1">Being worked on</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-green-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Resolved</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-green-300" /> : resolved}
            </div>
            <p className="text-xs text-slate-500 mt-1">Successfully closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent complaints table */}
        <Card className="lg:col-span-4 glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Complaints</CardTitle>
              <CardDescription>Your latest submissions and status.</CardDescription>
            </div>
            <Link to="/complaints">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : recent.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No complaints yet</p>
                <Link to="/complaint/new">
                  <Button size="sm" className="mt-3">Submit your first complaint</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-xs">ID</TableHead>
                    <TableHead className="font-semibold text-xs">Issue</TableHead>
                    <TableHead className="font-semibold text-xs hidden md:table-cell">Date</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((c) => (
                    <TableRow key={c._id} className="hover:bg-slate-50/80">
                      <TableCell className="font-mono text-xs">
                        <Link to={`/complaint/${c.complaintId}/track`} className="text-primary hover:underline">
                          {c.complaintId}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        <p className="font-medium line-clamp-1 max-w-[180px]">{c.title}</p>
                        <p className="text-xs text-slate-400 hidden sm:block">{CATEGORY_LABELS[c.category]}</p>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 hidden md:table-cell">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={c.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Right sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Quick actions */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/complaint/new" className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Submit Complaint</p>
                  <p className="text-xs text-slate-400">Report a new civic issue</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
              </Link>
              <Link to="/complaints" className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Track Complaints</p>
                  <p className="text-xs text-slate-400">View all your submissions</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
              </Link>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="glass-card flex-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Notifications</CardTitle>
                <Bell className="h-4 w-4 text-slate-400" />
              </div>
              <CardDescription>Recent updates from the city.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">AI Verification Active</p>
                  <p className="text-sm text-slate-500 mt-0.5">Detailed complaints are now auto-verified by AI for faster processing.</p>
                  <p className="text-xs text-slate-400 mt-1">Just now</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Water Supply Maintenance</p>
                  <p className="text-sm text-slate-500 mt-0.5">Supply affected in Sector 4 on Aug 5th, 10 AM – 4 PM.</p>
                  <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">New Community Park Open</p>
                  <p className="text-sm text-slate-500 mt-0.5">The Downtown community park is now open to the public.</p>
                  <p className="text-xs text-slate-400 mt-1">1 day ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
