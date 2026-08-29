import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  ArrowRight,
  Award,
  RotateCcw,
  MapPin,
  BarChart3,
  Gift,
  Building2,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/context/AuthContext"
import { getImageUrl, handleImageError } from "@/utils/imageUrl"
import { SkeletonKpiCard, SkeletonTable } from "@/components/common/SkeletonLoader"
import { EmptyState } from "@/components/common/EmptyState"

import {
  complaintApi,
  CATEGORY_LABELS,
  type Complaint,
  type ComplaintStatus,
} from "@/services/complaintApi"

function StatusBadge({ status }: { status: ComplaintStatus }) {
  if (status === "pending" || status === "submitted" || status === "ai_verified") {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-mono bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 inline-block" />
        {status === "ai_verified" ? "AI Verified" : "Pending"}
      </span>
    )
  }

  if (
    status === "ward_assigned" ||
    status === "officer_assigned" ||
    status === "worker_assigned" ||
    status === "in_progress" ||
    status === "resolution_submitted"
  ) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-mono bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 inline-block animate-pulse" />
        {status === "in_progress" ? "In Progress" : "Dispatched"}
      </span>
    )
  }

  if (status === "resolved" || status === "closed") {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />
        Resolved
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      {status}
    </span>
  )
}

interface Stats {
  total: number
  byStatus: Record<string, number>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [recent, setRecent] = useState<Complaint[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAuthLoading || !user) return
    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await complaintApi.getAll({ page: 1, limit: 5 })
        if (!isMounted) return
        setRecent(data.complaints || [])

        const byStatus: Record<string, number> = {}
        ;(data.complaints || []).forEach((c) => {
          byStatus[c.status] = (byStatus[c.status] || 0) + 1
        })
        setStats({ total: data.total || 0, byStatus })
      } catch {
        // fail silently on dashboard
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [isAuthLoading, user])

  const pending = (stats?.byStatus["pending"] || 0) + (stats?.byStatus["ai_verified"] || 0)
  const inProgress =
    (stats?.byStatus["assigned"] || 0) +
    (stats?.byStatus["in_progress"] || 0) +
    (stats?.byStatus["worker_assigned"] || 0)
  const resolved = (stats?.byStatus["resolved"] || 0) + (stats?.byStatus["closed"] || 0)

  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? t("dashPage.goodMorning", "Good morning")
      : hour < 17
      ? t("dashPage.goodAfternoon", "Good afternoon")
      : t("dashPage.goodEvening", "Good evening")

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-2 pb-12 px-2 sm:px-4">
      {/* Header with Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
            {greeting}, {user?.name?.split(" ")[0] || "Citizen"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            {t("dashPage.subtitle", "Track your active municipal grievances, ward SLA metrics, and civic karma.")}
          </p>
        </div>
        {user?.role === "citizen" && (
          <Link to="/complaint/create">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-600/20 text-xs font-semibold px-4 py-2 gap-2 active:scale-[0.98] transition-all">
              <Plus className="h-4 w-4" />
              <span>{t("dashPage.newComplaint", "Report New Issue")}</span>
            </Button>
          </Link>
        )}
      </div>

      {/* 1. Minimalist KPI Stats Cards */}
      {isLoading ? (
        <SkeletonKpiCard count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* Total Submissions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                {t("dashPage.totalSubmissions", "Total Reports")}
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold font-mono font-tabular tracking-tight text-slate-900 dark:text-white">
                {stats?.total ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">All-time municipal filings</p>
            </div>
          </div>

          {/* Pending / In-Triage */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                {t("dashPage.pending", "Pending Triage")}
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold font-mono font-tabular tracking-tight text-amber-600 dark:text-amber-400">
                {pending}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting ward assignment</p>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                {t("dashPage.inProgress", "Field In-Progress")}
              </span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold font-mono font-tabular tracking-tight text-sky-600 dark:text-sky-400">
                {inProgress}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Dispatched to field teams</p>
            </div>
          </div>

          {/* Resolved */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                {t("dashPage.resolved", "Resolved")}
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold font-mono font-tabular tracking-tight text-emerald-600 dark:text-emerald-400">
                {resolved}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Verified & closed tickets</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sleek Civic Karma Widget */}
      {(() => {
        const karmaPoints = user?.karmaPoints ?? 0
        const tierBadge =
          karmaPoints >= 150
            ? "Top 5% Contributor"
            : karmaPoints >= 50
            ? "Ward Guardian"
            : karmaPoints > 0
            ? "Active Citizen"
            : "Citizen Contributor"

        return (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/40 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/10 border border-emerald-200/80 dark:border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-emerald-950 dark:text-emerald-200 font-mono text-sm sm:text-base">
                    Civic Karma: {karmaPoints} Pts
                  </span>
                  <span className="inline-flex px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    {tierBadge}
                  </span>
                </div>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-400 mt-0.5 truncate">
                  Top contributor in {user?.ward || "Ward H-West"} • Earn municipal tax rebates & transit passes
                </p>
              </div>
            </div>
            <Link to="/rewards" className="shrink-0 w-full sm:w-auto">
              <Button
                size="sm"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold px-4 py-2 shadow-sm shadow-emerald-600/20 gap-1.5 transition-all min-h-[40px]"
              >
                <span>Redeem Rewards</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )
      })()}

      {/* 3. Main Split Grid: Recent Complaints + Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Polished Recent Complaints Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  {t("dashPage.recentComplaints", "Recent Grievances")}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t("dashPage.recentSubtitle", "Live tracking of recently reported issues in your ward")}
                </p>
              </div>
              <Link to="/complaints">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg h-8"
                >
                  <span>{t("dashPage.viewAll", "View All")}</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            <div className="w-full overflow-x-auto">
              {isLoading ? (
                <div className="p-4">
                  <SkeletonTable rows={4} cols={5} />
                </div>
              ) : recent.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title={t("dashPage.noComplaintsYet", "No Grievances Reported")}
                    description="No civic issues reported yet. Submit your first complaint with camera evidence and instant AI vision triage."
                    icon={FileText}
                    actionLabel={t("dashPage.submitFirst", "Report Issue")}
                    onAction={() => navigate("/complaint/create")}
                  />
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block w-full overflow-x-auto">
                    <Table className="w-full min-w-[500px]">
                      <TableHeader>
                        <TableRow className="bg-slate-50/60 dark:bg-slate-800/40 text-[11px] font-mono text-slate-500 uppercase">
                          <TableHead className="w-14 font-semibold">Photo</TableHead>
                          <TableHead className="font-semibold">ID</TableHead>
                          <TableHead className="font-semibold">Issue Details</TableHead>
                          <TableHead className="font-semibold hidden md:table-cell">Date</TableHead>
                          <TableHead className="font-semibold text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recent.map((c) => (
                          <TableRow
                            key={c._id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/60"
                          >
                            <TableCell>
                              <div className="h-9 w-9 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                                {c.attachments && c.attachments[0] ? (
                                  <img
                                    src={getImageUrl(c.attachments[0])}
                                    onError={handleImageError}
                                    alt="Evidence"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Building2 className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-semibold">
                              <Link
                                to={`/complaint/${c._id || c.id || c.complaintId}/track`}
                                className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                              >
                                <span>{c.complaintId || c._id?.slice(-6).toUpperCase()}</span>
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </Link>
                            </TableCell>
                            <TableCell>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[220px]">
                                {c.title}
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                {CATEGORY_LABELS[c.category] || c.category} • {c.ward || "Ward A"}
                              </p>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 font-mono hidden md:table-cell">
                              {new Date(c.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <StatusBadge status={c.status} />
                                {c.status === "resolved" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-[11px] text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950/30 h-7 px-2 rounded-lg"
                                    onClick={async () => {
                                      const reason = prompt(
                                        "State reason for reopening issue:",
                                        "Resolution unsatisfactory"
                                      )
                                      if (!reason) return
                                      try {
                                        await complaintApi.reopen(c._id, reason)
                                        toast.success("Ticket reopened & escalated to CRITICAL priority!")
                                        setRecent((prev) =>
                                          prev.map((item) =>
                                            item._id === c._id
                                              ? { ...item, status: "pending", priority: "critical" }
                                              : item
                                          )
                                        )
                                      } catch {
                                        toast.error("Could not reopen ticket.")
                                      }
                                    }}
                                  >
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    {t("dashPage.reopen", "Reopen")}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card Stack */}
                  <div className="block md:hidden p-3 space-y-2.5">
                    {recent.map((c) => (
                      <div
                        key={c._id}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                              {c.attachments && c.attachments[0] ? (
                                <img
                                  src={getImageUrl(c.attachments[0])}
                                  onError={handleImageError}
                                  alt="Evidence"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Building2 className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/complaint/${c._id || c.id || c.complaintId}/track`}
                                className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                {c.complaintId || c._id?.slice(-6).toUpperCase()}
                              </Link>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                                {c.title}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={c.status} />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                          <span>{CATEGORY_LABELS[c.category] || c.category} • {c.ward || "Ward A"}</span>
                          <Link
                            to={`/complaint/${c._id || c.id || c.complaintId}/track`}
                            className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                          >
                            <span>Track</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Quick Actions (2x2) & Live Feed */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Action Triggers 2x2 Grid */}
          <Card className="border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("dashPage.quickActions", "Quick Actions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 grid grid-cols-2 gap-2.5">
              <Link
                to="/complaint/create"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-center group"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform mb-1.5">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">File Grievance</span>
                <span className="text-[10px] text-slate-400">AI Vision upload</span>
              </Link>

              <Link
                to="/map"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-sky-500/50 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-all text-center group"
              >
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform mb-1.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Ward Map</span>
                <span className="text-[10px] text-slate-400">24-Ward GIS</span>
              </Link>

              <Link
                to="/complaints"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all text-center group"
              >
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform mb-1.5">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">View Ledger</span>
                <span className="text-[10px] text-slate-400">Status history</span>
              </Link>

              <Link
                to="/rewards"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all text-center group"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform mb-1.5">
                  <Gift className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Rewards</span>
                <span className="text-[10px] text-slate-400">Redeem vouchers</span>
              </Link>
            </CardContent>
          </Card>

          {/* Live Ward Activity & SLA Summary Widget */}
          <Card className="border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4">
            <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ward SLA & Field Readiness
                </CardTitle>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Ward H-West
              </span>
            </CardHeader>
            <CardContent className="p-0 space-y-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400 font-mono">Avg Resolution Velocity</p>
                  <p className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    18.4 Hours <span className="text-[10px] font-medium text-emerald-600 font-sans">(94.2% on-time)</span>
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400 font-mono">Field Crew Deployment</p>
                  <p className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    14 Active Crews
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600">
                  <Activity className="w-4 h-4" />
                </div>
              </div>

              <Link
                to="/map"
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 rounded-xl transition-colors group"
              >
                <span>View 24-Ward GIS Radar</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
