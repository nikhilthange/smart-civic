import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  History, Search, Plus, RefreshCw, Filter, ChevronLeft,
  ChevronRight, Trash2, AlertCircle, Loader2, FileX
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { useTranslation } from "react-i18next"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { useAuth } from "@/context/AuthContext"
import { getImageUrl, handleImageError } from "@/utils/imageUrl"

import {
  complaintApi, STATUS_CONFIG, CATEGORY_LABELS,
  type Complaint, type ComplaintStatus
} from "@/services/complaintApi"

function StatusBadge({ status }: { status: ComplaintStatus | string }) {
  const cfg = STATUS_CONFIG[status as ComplaintStatus] || {
    label: status,
    color: "text-gray-700",
    bg: "bg-gray-100",
    border: "border-gray-300"
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.label}
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
      const params: Record<string, string | number> = { page, limit: 8 }
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
    const timer = setTimeout(load, search ? 400 : 0)
    return () => clearTimeout(timer)
  }, [load, search, isAuthLoading])

  const handleDelete = async (id: string) => {
    try {
      await complaintApi.delete(id)
      setDeleteId(null)
      load()
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Failed to delete."
      alert(msg)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
            <History className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("complaints.title", "My Complaints")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">{total} {t("complaints.submissions", "submissions")}</p>
          </div>
        </div>
        {user?.role === "citizen" && (
          <Link to="/complaint/create" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] sm:min-h-[40px] rounded-xl gap-2 shadow-sm touch-manipulation">
              <Plus className="h-4 w-4" />
              {t("complaints.newComplaint", "File New Complaint")}
            </Button>
          </Link>
        )}
      </div>

      {/* Main Card */}
      <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">{t("complaints.history", "Grievance Redressal Records")}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{t("complaints.subtitle", "Track the status of all your submitted complaints.")}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t("complaints.searchPlaceholder", "Search by ID, title, or category...")}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 h-11 sm:h-9 text-xs sm:text-sm w-full"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full min-w-0 touch-pan-x">
              <Filter className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
              {[
                { label: t("complaints.all", "All"), value: "all" },
                { label: t("complaints.pending", "Pending"), value: "pending" },
                { label: t("complaints.aiVerified", "AI Verified"), value: "ai_verified" },
                { label: t("complaints.assigned", "Assigned"), value: "assigned" },
                { label: t("complaints.inProgress", "In Progress"), value: "in_progress" },
                { label: t("complaints.resolved", "Resolved"), value: "resolved" },
                { label: t("complaints.rejected", "Rejected"), value: "rejected" },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => { setStatusFilter(f.value as ComplaintStatus | "all"); setPage(1) }}
                  className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-medium border transition-all min-h-[44px] touch-manipulation cursor-pointer flex items-center justify-center ${
                    statusFilter === f.value
                      ? "bg-emerald-600 text-white border-emerald-600 font-semibold shadow-sm"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table / Error / Loading / Empty States — Mutually Exclusive */}
          {isLoading || isAuthLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl bg-red-50/70 border border-red-200 dark:bg-red-950/20 dark:border-red-900 text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-red-500 shrink-0" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300 text-sm sm:text-base">{error}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">An error occurred while fetching your records from the civic portal.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={load}
                className="gap-1.5 border-red-300 text-red-700 hover:bg-red-100 min-h-[40px] rounded-xl mt-2 touch-manipulation"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          ) : complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center px-4">
              <FileX className="h-12 w-12 mb-3 text-slate-400" />
              <p className="font-medium text-slate-600 dark:text-slate-300">{t("complaints.noComplaints", "No complaints found")}</p>
              <p className="text-xs sm:text-sm mt-1 text-slate-500 max-w-sm">
                {search || statusFilter !== "all"
                  ? "No complaints match your active filter criteria."
                  : t("complaints.noComplaintsDesc", "You haven't reported any civic complaints yet.")}
              </p>
              {!search && statusFilter === "all" && user?.role === "citizen" && (
                <Link to="/complaint/create" className="w-full sm:w-auto">
                  <Button className="mt-4 min-h-[44px] w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl touch-manipulation" size="sm">
                    {t("complaints.newComplaint", "File New Complaint")}
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
                <Table className="w-full min-w-[600px]">
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                      <TableHead className="font-semibold">{t("table.evidence", "Evidence")}</TableHead>
                      <TableHead className="font-semibold">{t("table.id", "Ticket ID")}</TableHead>
                      <TableHead className="font-semibold">{t("table.title", "Title")}</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell">{t("table.category", "Category")}</TableHead>
                      <TableHead className="font-semibold hidden sm:table-cell">{t("table.date", "Date")}</TableHead>
                      <TableHead className="font-semibold">{t("table.status", "Status")}</TableHead>
                      <TableHead className="text-right font-semibold">{t("table.actions", "Actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((c) => (
                      <TableRow key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <TableCell>
                          <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shrink-0">
                            <img
                              src={getImageUrl(c.attachments && c.attachments[0])}
                              onError={handleImageError}
                              alt="Evidence"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                          {c.complaintId}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-xs text-slate-900 dark:text-slate-100 max-w-xs truncate">{c.title}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-600 dark:text-slate-400">
                          {CATEGORY_LABELS[c.category]}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                          {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={c.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/complaint/${c._id || (c as any).id || c.complaintId}/track`)}
                              className="min-h-[36px] touch-manipulation"
                            >
                              Track
                            </Button>
                            {["pending", "ai_verified"].includes(c.status) && (
                              deleteId === c._id ? (
                                <div className="flex gap-1">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(c._id)}
                                    className="min-h-[36px]"
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteId(null)}
                                    className="min-h-[36px]"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 min-h-[36px] min-w-[36px]"
                                  onClick={() => setDeleteId(c._id)}
                                >
                                  <Trash2 className="h-4 w-4" />
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

              {/* Mobile Adaptive Card Stack (< md) */}
              <div className="block md:hidden space-y-3">
                {complaints.map((c) => (
                  <div
                    key={c._id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-12 w-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shrink-0">
                          <img
                            src={getImageUrl(c.attachments && c.attachments[0])}
                            onError={handleImageError}
                            alt="Evidence"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {c.complaintId}
                          </p>
                          <h3 className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate mt-0.5">
                            {c.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 truncate">
                            {CATEGORY_LABELS[c.category] || c.category} • {c.ward || "Ward H-West"}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </span>
                      <div className="flex items-center gap-2">
                        {["pending", "ai_verified"].includes(c.status) && (
                          deleteId === c._id ? (
                            <div className="flex gap-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(c._id)}
                                className="h-8 px-2 text-xs"
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(null)}
                                className="h-8 px-2 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 h-8 px-2 text-xs"
                              onClick={() => setDeleteId(c._id)}
                            >
                              Delete
                            </Button>
                          )
                        )}
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 text-xs rounded-lg min-h-[36px] touch-manipulation"
                          onClick={() => navigate(`/complaint/${c._id || (c as any).id || c.complaintId}/track`)}
                        >
                          Track Status &rarr;
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-500">
                    Page {page} of {pages} ({total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
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
