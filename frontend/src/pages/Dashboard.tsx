import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import {
  Activity, AlertTriangle, CheckCircle2, Clock, FileText,
  Bot, Plus, ArrowRight, Loader2, Bell, Award, RotateCcw
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
  const { t } = useTranslation()
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
  const greeting = hour < 12 ? t("dashPage.goodMorning") : hour < 17 ? t("dashPage.goodAfternoon") : t("dashPage.goodEvening")

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {greeting}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t("dashPage.subtitle")}
          </p>
        </div>
        <Link to="/complaint/new">
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Plus className="h-4 w-4" />
            {t("dashPage.newComplaint")}
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t("dashPage.totalSubmissions")}</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : stats?.total ?? 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("dashPage.allTimeComplaints")}</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-amber-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t("dashPage.pending")}</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-amber-300" /> : pending}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("dashPage.awaitingAction")}</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-blue-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t("dashPage.inProgress")}</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-blue-300" /> : inProgress}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("dashPage.beingWorkedOn")}</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-green-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t("dashPage.resolved")}</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-green-300" /> : resolved}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("dashPage.successfullyClosed")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Civic Karma Banner */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-indigo-700 text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-lg">
            <Award className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{t("dashPage.karmaScore")}: {user?.karmaPoints ?? (stats?.total ? stats.total * 10 : 10)} Points</h3>
            <p className="text-xs text-blue-100 mt-0.5">{t("dashPage.karmaDesc")}</p>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent complaints table */}
        <Card className="lg:col-span-4 glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("dashPage.recentComplaints")}</CardTitle>
              <CardDescription>{t("dashPage.recentSubtitle")}</CardDescription>
            </div>
            <Link to="/complaints">
              <Button variant="ghost" size="sm" className="gap-1 text-emerald-600 hover:text-emerald-700">
                {t("dashPage.viewAll")} <ArrowRight className="h-3 w-3" />
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
                <p className="text-slate-500 text-sm">{t("dashPage.noComplaintsYet")}</p>
                <Link to="/complaint/new">
                  <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white">{t("dashPage.submitFirst")}</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead className="font-semibold text-xs">{t("dashPage.id")}</TableHead>
                    <TableHead className="font-semibold text-xs">{t("dashPage.issue")}</TableHead>
                    <TableHead className="font-semibold text-xs hidden md:table-cell">{t("dashPage.date")}</TableHead>
                    <TableHead className="font-semibold text-xs text-right">{t("dashPage.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((c) => (
                    <TableRow key={c._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80">
                      <TableCell className="font-mono text-xs">
                        <Link to={`/complaint/${c._id || c.id || c.complaintId}/track`} className="text-emerald-600 font-semibold hover:underline">
                          {c.complaintId || c._id}
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
                        <div className="flex items-center justify-end gap-2">
                          <StatusBadge status={c.status} />
                          {c.status === "resolved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 h-7 px-2"
                              onClick={async () => {
                                const reason = prompt("State reason for reopening issue:", "Resolution unsatisfactory");
                                if (!reason) return;
                                try {
                                  await complaintApi.reopen(c._id, reason);
                                  toast.success("Ticket reopened & escalated to CRITICAL priority!");
                                  window.location.reload();
                                } catch {
                                  toast.error("Could not reopen ticket.");
                                }
                              }}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              {t("dashPage.reopen")}
                            </Button>
                          )}
                        </div>
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
              <CardTitle>{t("dashPage.quickActions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/complaint/new" className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t("dashPage.submitComplaint")}</p>
                  <p className="text-xs text-slate-400">{t("dashPage.submitDesc")}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
              </Link>
              <Link to="/complaints" className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t("dashPage.trackComplaints")}</p>
                  <p className="text-xs text-slate-400">{t("dashPage.trackDesc")}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
              </Link>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="glass-card flex-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>{t("dashPage.notifications")}</CardTitle>
                <Bell className="h-4 w-4 text-slate-400" />
              </div>
              <CardDescription>{t("dashPage.notifSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t("dashPage.aiNotifTitle")}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t("dashPage.aiNotifDesc")}</p>
                  <p className="text-xs text-slate-400 mt-1">{t("dashPage.justNow")}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t("dashPage.waterNotifTitle")}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t("dashPage.waterNotifDesc")}</p>
                  <p className="text-xs text-slate-400 mt-1">{t("dashPage.hoursAgo")}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t("dashPage.parkNotifTitle")}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t("dashPage.parkNotifDesc")}</p>
                  <p className="text-xs text-slate-400 mt-1">{t("dashPage.dayAgo")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
