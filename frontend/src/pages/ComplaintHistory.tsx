import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Search, Plus, RefreshCw, ChevronLeft,
  ChevronRight, Trash2, AlertCircle, Loader2, FileX,
  Camera, ExternalLink, MapPin
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { useTranslation } from "react-i18next"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { useAuth } from "@/context/AuthContext"
import { getImageUrl, handleImageError } from "@/utils/imageUrl"
import { EmptyState } from "@/components/common/EmptyState"
import toast from "react-hot-toast"

import {
  complaintApi, CATEGORY_LABELS,
  type Complaint, type ComplaintStatus
} from "@/services/complaintApi"

function StatusBadge({ status }: { status: ComplaintStatus | string }) {
  const { t } = useTranslation()
  const s = String(status).toLowerCase()
  if (s === "resolved" || s === "closed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        {t("status.resolved", "Resolved")}
      </span>
    )
  }
  if (["in_progress", "ward_assigned", "officer_assigned", "worker_assigned", "resolution_submitted"].includes(s)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/80">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
        {t("status.in_progress", "In Progress")}
      </span>
    )
  }
  if (s === "ai_verified") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        {t("status.ai_verified", "AI Verified")}
      </span>
    )
  }
  if (s === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        {t("status.rejected", "Rejected")}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
      {t("status.pending", "Pending")}
    </span>
  )
}

export default function ComplaintHistory() {
  const { t } = useTranslation()
  const { user, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">("all")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (isAuthLoading) return
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number> = { page, limit: 10 }
      if (search) params.search = search
      if (statusFilter !== "all") params.status = statusFilter
      const data = await complaintApi.getAll(params)
      setComplaints(data.complaints || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } catch (err) {
      console.error("ComplaintHistory load error:", err)
      setError("Failed to load complaints. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }, [page, search, statusFilter, isAuthLoading, user])

  useEffect(() => {
    if (isAuthLoading) return
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [load, search, isAuthLoading])

  const handleDelete = async (id: string) => {
    try {
      await complaintApi.delete(id)
      setDeleteId(null)
      toast.success("Complaint deleted successfully")
      load()
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Failed to delete complaint."
      toast.error(msg || "Failed to delete complaint.")
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Grievance Redressal Records
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {total} Total
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track, filter, and audit municipal complaint lifecycle & SLA milestones.
          </p>
        </div>

        {user?.role === "citizen" && (
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm px-4 h-10 gap-2 shrink-0 cursor-pointer"
          >
            <Link to="/complaint/create">
              <Plus className="h-4 w-4" />
              <span>File New Grievance</span>
            </Link>
          </Button>
        )}
      </div>

      {/* ── Main Workspace Card ── */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Search & Segmented Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t("complaints.searchPlaceholder", "Search complaints by title, ID, or location...")}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-10 h-10 text-xs sm:text-sm w-full rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setPage(1) }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { label: t("complaints.all", "All Complaints"), value: "all" },
                { label: t("complaints.pending", "Pending"), value: "pending" },
                { label: t("complaints.aiVerified", "AI Verified"), value: "ai_verified" },
                { label: t("complaints.inProgress", "In Progress"), value: "in_progress" },
                { label: t("complaints.resolved", "Resolved"), value: "resolved" },
                { label: t("complaints.rejected", "Rejected"), value: "rejected" },
              ].map((f) => {
                const isSelected = statusFilter === f.value
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => { setStatusFilter(f.value as ComplaintStatus | "all"); setPage(1) }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60"
                    }`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Table / Error / Loading / Empty States */}
          {isLoading || isAuthLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              <p className="text-xs text-slate-500 font-medium">Fetching grievance records...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 rounded-xl bg-red-50/60 border border-red-200 dark:bg-red-950/20 dark:border-red-900 text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-red-500 shrink-0" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300 text-sm sm:text-base">{error}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">An error occurred while fetching your records from the civic portal.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={load}
                className="gap-1.5 border-red-300 text-red-700 hover:bg-red-100 rounded-xl"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          ) : complaints.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={FileX}
                title={
                  search || statusFilter !== "all"
                    ? "No matching grievance records found"
                    : t("complaints.noComplaints", "No complaints found")
                }
                description={
                  search || statusFilter !== "all"
                    ? `No submissions found for status "${statusFilter}" matching query "${search}". Try resetting filters.`
                    : t("complaints.noComplaintsDesc", "You haven't reported any civic complaints yet.")
                }
                actionLabel={
                  !search && statusFilter === "all" && user?.role === "citizen"
                    ? t("complaints.newComplaint", "File New Complaint")
                    : undefined
                }
                onAction={
                  !search && statusFilter === "all" && user?.role === "citizen"
                    ? () => navigate("/complaint/create")
                    : undefined
                }
                secondaryActionLabel={
                  search || statusFilter !== "all"
                    ? "Reset Filters"
                    : undefined
                }
                onSecondaryAction={
                  search || statusFilter !== "all"
                    ? () => { setSearch(""); setStatusFilter("all"); setPage(1); }
                    : undefined
                }
              />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <Table className="w-full text-left">
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <TableHead className="w-14">Photo</TableHead>
                      <TableHead className="w-36 font-mono">{t("table.id", "Ticket ID")}</TableHead>
                      <TableHead>{t("table.title", "Complaint Title")}</TableHead>
                      <TableHead className="w-36">{t("table.category", "Category")}</TableHead>
                      <TableHead className="w-32 font-mono">{t("table.date", "Date Filed")}</TableHead>
                      <TableHead className="w-32">{t("table.status", "Status")}</TableHead>
                      <TableHead className="w-24 text-right">{t("table.actions", "Actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {complaints.map((c) => (
                      <TableRow
                        key={c._id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/complaint/${c._id || (c as any).id || c.complaintId}/track`)}
                      >
                        {/* Evidence Thumbnail */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            {c.attachments && c.attachments[0] ? (
                              <img
                                src={getImageUrl(c.attachments[0])}
                                onError={handleImageError}
                                alt="Evidence"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Camera className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </TableCell>

                        {/* Ticket ID */}
                        <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {c.complaintId}
                        </TableCell>

                        {/* Title & Location */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {c.title}
                            </p>
                            {c.location?.address || (c as any).address ? (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate max-w-sm">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{c.location?.address || (c as any).address}</span>
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400">Ward {(c as any).ward || "H-West"}</p>
                            )}
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {t(`categories.${c.category}`, CATEGORY_LABELS[c.category] || c.category)}
                          </span>
                        </TableCell>

                        {/* Date Filed */}
                        <TableCell className="text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge status={c.status} />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/complaint/${c._id || (c as any).id || c.complaintId}/track`)}
                              className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 gap-1 rounded-lg"
                            >
                              <span>{t("table.track", "Track")}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Button>

                            {["pending", "ai_verified"].includes(c.status) && (
                              deleteId === c._id ? (
                                <div className="flex gap-1">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(c._id)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteId(null)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                                  onClick={() => setDeleteId(c._id)}
                                  title="Delete complaint"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Adaptive Card Stack */}
              <div className="block md:hidden space-y-3">
                {complaints.map((c) => (
                  <div
                    key={c._id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 cursor-pointer shadow-xs"
                    onClick={() => navigate(`/complaint/${c._id || (c as any).id || c.complaintId}/track`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shrink-0">
                          {c.attachments && c.attachments[0] ? (
                            <img
                              src={getImageUrl(c.attachments[0])}
                              onError={handleImageError}
                              alt="Evidence"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400">
                              <Camera className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {c.complaintId}
                          </p>
                          <h3 className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate mt-0.5">
                            {c.title}
                          </h3>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                      <span>{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        Track Details &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400">
                  <p>
                    Showing page <span className="font-bold text-slate-900 dark:text-white">{page}</span> of{" "}
                    <span className="font-bold text-slate-900 dark:text-white">{pages}</span> ({total} records)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                      className="h-8 px-3 rounded-lg text-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pages}
                      onClick={() => setPage(p => p + 1)}
                      className="h-8 px-3 rounded-lg text-xs"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

