import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
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
  Wrench,
  Shield,
  ShieldAlert,
  Database,
  Waves,
  Camera,
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
import type { Variants } from "framer-motion"

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
}

function StatusBadge({ status }: { status: ComplaintStatus }) {
  const { t } = useTranslation()
  if (status === "pending" || status === "submitted" || status === "ai_verified") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        {status === "ai_verified" ? t("status.ai_verified", "AI Verified") : t("status.pending", "Pending")}
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
        {status === "in_progress" ? t("status.in_progress", "In Progress") : t("status.dispatched", "Dispatched")}
      </span>
    )
  }

  if (status === "resolved" || status === "closed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {t("status.resolved", "Resolved")}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      {t(`status.${status}`, status)}
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-7xl mx-auto space-y-6 pt-1 pb-12 px-2 sm:px-4"
    >
      {/* 1. Header with Municipal Telemetry Context & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">CityOS Municipal Hub</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">{user?.ward || "Mumbai Central Zone"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {greeting}, {user?.name?.split(" ")[0] || "Citizen"}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/quick-report">
            <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs gap-1.5">
              <Camera className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Quick Report</span>
            </Button>
          </Link>
          {user?.role === "citizen" && (
            <Link to="/complaint/create">
              <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold px-4 py-2 gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" />
                <span>{t("dashPage.newComplaint", "Report Grievance")}</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Refined Handcrafted KPI Cards */}
      {isLoading ? (
        <SkeletonKpiCard count={4} />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3.5"
        >
          {/* Total Submissions */}
          <motion.div
            variants={staggerItem}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {t("dashPage.totalSubmissions", "Total Reports")}
              </span>
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 tracking-tight">
                {stats?.total ?? 0}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">All-time submitted grievances</p>
            </div>
          </motion.div>

          {/* Pending */}
          <motion.div
            variants={staggerItem}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {t("dashPage.pending", "Pending Triage")}
              </span>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 tracking-tight">
                {pending}
              </div>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Awaiting ward assignment
              </p>
            </div>
          </motion.div>

          {/* In Progress */}
          <motion.div
            variants={staggerItem}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {t("dashPage.inProgress", "Field In-Progress")}
              </span>
              <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 tracking-tight">
                {inProgress}
              </div>
              <p className="text-[11px] text-sky-600/80 dark:text-sky-400/80 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Dispatched to field teams
              </p>
            </div>
          </motion.div>

          {/* Resolved */}
          <motion.div
            variants={staggerItem}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {t("dashPage.resolved", "Resolved")}
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 tracking-tight">
                {resolved}
              </div>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Verified & closed tickets
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 3. Refined Civic Karma Progress Banner (Citizen Only) */}
      {user?.role === "citizen" &&
        (() => {
          const karmaPoints = user?.karmaPoints ?? 0
          const tierBadge =
            karmaPoints >= 150
              ? "Ward Guardian (Tier 3)"
              : karmaPoints >= 50
              ? "Active Contributor (Tier 2)"
              : karmaPoints > 0
              ? "Verified Citizen (Tier 1)"
              : "Citizen Member"

          const progressPercent = Math.min(100, Math.round((karmaPoints / 200) * 100))

          return (
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                        Civic Karma: {karmaPoints} Points
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {tierBadge}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Earn municipal tax incentives & priority response times by participating in ward upkeep.
                    </p>
                  </div>
                </div>
                <Link to="/rewards" className="shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs font-semibold rounded-xl border-zinc-200 dark:border-zinc-700"
                  >
                    <span>View Benefits</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>{karmaPoints} / 200 pts to next tier</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })()}

      {/* 3. Main Split Grid: Recent Complaints + Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Polished Recent Complaints Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {t("dashPage.recentComplaints", "Recent Grievances")}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {t("dashPage.recentSubtitle", "Live tracking of recently reported issues in your ward")}
                </p>
              </div>
              <Link to="/complaints">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg h-8"
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
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800">
                          <TableHead className="w-12 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Photo</TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">ID</TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Issue Details</TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 hidden md:table-cell font-mono">Date</TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recent.map((c) => (
                          <TableRow
                            key={c._id}
                            className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors border-b border-zinc-100 dark:border-zinc-800/60"
                          >
                            <TableCell>
                              <div className="h-8 w-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                                {c.attachments && c.attachments[0] ? (
                                  <img
                                    src={getImageUrl(c.attachments[0])}
                                    onError={handleImageError}
                                    alt="Evidence"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Building2 className="w-4 h-4 text-zinc-400" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-semibold">
                              <Link
                                to={`/complaint/${c._id || c.id || c.complaintId}/track`}
                                className="text-zinc-900 dark:text-zinc-100 hover:underline inline-flex items-center gap-1"
                              >
                                <span>{c.complaintId || c._id?.slice(-6).toUpperCase()}</span>
                                <ExternalLink className="w-3 h-3 opacity-50" />
                              </Link>
                            </TableCell>
                            <TableCell>
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 max-w-[240px]">
                                {c.title}
                              </p>
                              <p className="text-[11px] text-zinc-400 line-clamp-1">
                                {CATEGORY_LABELS[c.category] || c.category} • {c.ward || "Ward A"}
                              </p>
                            </TableCell>
                            <TableCell className="text-xs text-zinc-500 font-mono tabular-nums hidden md:table-cell">
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
                                    className="text-[11px] h-7 px-2 rounded-lg"
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
                        className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-9 w-9 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                              {c.attachments && c.attachments[0] ? (
                                <img
                                  src={getImageUrl(c.attachments[0])}
                                  onError={handleImageError}
                                  alt="Evidence"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Building2 className="w-4 h-4 text-zinc-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/complaint/${c._id || c.id || c.complaintId}/track`}
                                className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:underline"
                              >
                                {c.complaintId || c._id?.slice(-6).toUpperCase()}
                              </Link>
                              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate mt-0.5">
                                {c.title}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={c.status} />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50">
                          <span>{CATEGORY_LABELS[c.category] || c.category} • {c.ward || "Ward A"}</span>
                          <Link
                            to={`/complaint/${c._id || c.id || c.complaintId}/track`}
                            className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1"
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

        {/* Right 4 Cols: Quick Actions & Live Feed */}
        <div className="lg:col-span-4 space-y-5">
          {/* Quick Action Triggers Grid */}
          <Card className="border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-5">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-500">
                {t("dashPage.quickActions", "Quick Actions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 grid grid-cols-2 gap-2.5">
              {(() => {
                const role = user?.role || "citizen"
                const actions =
                  role === "worker"
                    ? [
                        { to: "/worker-queue", label: "Worker Queue", sub: "Active & Pool", icon: Wrench },
                        { to: "/map", label: "Ward Map", sub: "24-Ward GIS", icon: MapPin },
                        { to: "/complaints", label: "View Ledger", sub: "Task history", icon: BarChart3 },
                        { to: "/quick-report", label: "Field Snap", sub: "Instant report", icon: Plus },
                      ]
                    : role === "officer"
                    ? [
                        { to: "/officer-portal", label: "Officer Triage", sub: "Ward desk", icon: Shield },
                        { to: "/monsoon-radar", label: "Monsoon Radar", sub: "Flood telemetry", icon: Waves },
                        { to: "/map", label: "Ward Map", sub: "24-Ward GIS", icon: MapPin },
                        { to: "/complaints", label: "All Complaints", sub: "Triage ledger", icon: BarChart3 },
                      ]
                    : role === "admin"
                    ? [
                        { to: "/admin", label: "Admin Command", sub: "Operations", icon: ShieldAlert },
                        { to: "/admin/data-studio", label: "Data Studio", sub: "Analytics", icon: Database },
                        { to: "/admin/analytics", label: "Analytics", sub: "KPI metrics", icon: BarChart3 },
                        { to: "/map", label: "City GIS Map", sub: "Mumbai live", icon: MapPin },
                      ]
                    : [
                        { to: "/complaint/create", label: "File Grievance", sub: "Photo & details", icon: Plus },
                        { to: "/map", label: "Ward Map", sub: "24-Ward GIS", icon: MapPin },
                        { to: "/complaints", label: "View Ledger", sub: "Status history", icon: BarChart3 },
                        { to: "/rewards", label: "Rewards", sub: "Redeem perks", icon: Gift },
                      ]

                return actions.map((act) => {
                  const Icon = act.icon
                  return (
                    <Link
                      key={act.to}
                      to={act.to}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-center group"
                    >
                      <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:scale-105 transition-transform mb-1.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{act.label}</span>
                      <span className="text-[10px] text-zinc-400">{act.sub}</span>
                    </Link>
                  )
                })
              })()}
            </CardContent>
          </Card>

          {/* Live Ward Activity Widget */}
          <Card className="border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500">Ward Readiness</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                98.4% SLA Compliance
              </span>
            </div>
            <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center justify-between">
                <span>Active Field Crews</span>
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">14 Teams On-Duty</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Avg Resolution Time</span>
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">4.8 Hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Emergency SWM Patrol</span>
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">Normal</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
