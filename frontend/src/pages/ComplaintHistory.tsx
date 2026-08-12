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
  const { user } = useAuth()
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
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number> = { page, limit: 8 }
      if (search) params.search = search
      if (statusFilter !== "all") params.status = statusFilter
      const data = await complaintApi.getAll(params)
      setComplaints(data.complaints)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      setError("Failed to load complaints. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    const timer = setTimeout(load, search ? 400 : 0)
    return () => clearTimeout(timer)
  }, [load, search])

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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
            <History className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("complaints.title", "My Complaints")}
            </h1>
            <p className="text-sm text-slate-500">{total} {t("complaints.submissions", "submissions")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          {user?.role === "citizen" && (
            <Link to="/complaint/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t("complaints.newComplaint", "File New Complaint")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>{t("complaints.submissions", "Submissions")}</CardTitle>
          <CardDescription>{t("complaints.subtitle", "Track the status of all your submitted complaints.")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t("complaints.searchPlaceholder", "Search by ID or title...")}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
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
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    statusFilter === f.value
                      ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <FileX className="h-12 w-12 mb-3 text-slate-400" />
              <p className="font-medium text-slate-600">{t("complaints.noComplaints", "No complaints found")}</p>
              <p className="text-sm mt-1">
                {t("complaints.noComplaintsDesc", "You haven't reported any civic complaints yet.")}
              </p>
              {!search && statusFilter === "all" && user?.role === "citizen" && (
                <Link to="/complaint/create">
                  <Button className="mt-4" size="sm">{t("complaints.newComplaint", "File New Complaint")}</Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
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
                      <TableRow key={c._id} className="hover:bg-slate-50/80">
                        <TableCell>
                          <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                            <img
                              src={getImageUrl(c.attachments && c.attachments[0])}
                              onError={handleImageError}
                              alt="Evidence"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">{c.complaintId}</TableCell>
                        <TableCell>
                          <p className="font-medium text-slate-800 line-clamp-1 max-w-[200px]">{c.title}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-600">
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
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-400 hover:text-red-600 hover:bg-red-50"
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
