import { useState, useCallback, useEffect } from "react"
import { Link } from "react-router-dom"
import { useDebounce } from "use-debounce"
import {
  Search, Filter, SlidersHorizontal, X, ChevronUp, ChevronDown,
  ArrowUpDown, ExternalLink, ChevronLeft, ChevronRight, RotateCcw, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  complaintApi, type Complaint, CATEGORY_LABELS, STATUS_CONFIG,
  type ComplaintStatus, type ComplaintCategory
} from "@/services/complaintApi"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Filters {
  search: string
  category: ComplaintCategory | ""
  status: ComplaintStatus | ""
  priority: string
  city: string
  dateFrom: string
  dateTo: string
}

type SortField = "createdAt" | "updatedAt" | "priority" | "status" | "category"
type SortOrder = "asc" | "desc"

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS = [
  { value: "low",      label: "Low",      color: "text-slate-600" },
  { value: "medium",   label: "Medium",   color: "text-amber-600" },
  { value: "high",     label: "High",     color: "text-orange-600" },
  { value: "critical", label: "Critical", color: "text-red-600" },
]

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: "createdAt",  label: "Date Reported" },
  { value: "updatedAt",  label: "Last Updated"  },
  { value: "priority",   label: "Priority"      },
  { value: "status",     label: "Status"        },
]

const PAGE_SIZE_OPTIONS = [10, 25, 50]

const EMPTY_FILTERS: Filters = {
  search: "", category: "", status: "", priority: "", city: "", dateFrom: "", dateTo: ""
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SearchComplaints() {
  const [filters, setFilters]       = useState<Filters>(EMPTY_FILTERS)
  const [sortBy, setSortBy]         = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder]   = useState<SortOrder>("desc")
  const [page, setPage]             = useState(1)
  const [pageSize, setPageSize]     = useState(10)
  const [showFilters, setShowFilters] = useState(true)

  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [total, setTotal]           = useState(0)
  const [pages, setPages]           = useState(1)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const [debouncedSearch] = useDebounce(filters.search, 400)

  const fetchComplaints = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number> = {
        page, limit: pageSize, sortBy, sortOrder,
      }
      if (debouncedSearch) params.search  = debouncedSearch
      if (filters.category) params.category = filters.category
      if (filters.status)   params.status   = filters.status
      if (filters.priority) params.priority  = filters.priority
      if (filters.city)     params.city      = filters.city
      if (filters.dateFrom) params.dateFrom  = filters.dateFrom
      if (filters.dateTo)   params.dateTo    = filters.dateTo

      const res = await complaintApi.getAll(params)
      setComplaints(res.complaints)
      setTotal(res.total)
      setPages(res.pages)
    } catch {
      setError("Failed to load complaints. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortBy, sortOrder, debouncedSearch, filters.category, filters.status, filters.priority, filters.city, filters.dateFrom, filters.dateTo])

  useEffect(() => { fetchComplaints() }, [fetchComplaints])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [debouncedSearch, filters.category, filters.status, filters.priority, filters.city, filters.dateFrom, filters.dateTo, sortBy, sortOrder, pageSize])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    setSortBy("createdAt")
    setSortOrder("desc")
    setPage(1)
  }

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(o => o === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && k !== "search").length

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Search Complaints</h1>
          <p className="text-slate-500 mt-1">Filter, sort, and paginate all civic reports</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(f => !f)} className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
        <Input
          placeholder="Search by title, ID, description, or address..."
          value={filters.search}
          onChange={e => handleFilterChange("search", e.target.value)}
          className="pl-12 h-12 text-base rounded-xl"
        />
        {filters.search && (
          <button onClick={() => handleFilterChange("search", "")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" /> Advanced Filters
              </CardTitle>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-slate-500 gap-1 h-8">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Category</label>
                <select
                  value={filters.category}
                  onChange={e => handleFilterChange("category", e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                >
                  <option value="">All Categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</label>
                <select
                  value={filters.status}
                  onChange={e => handleFilterChange("status", e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                >
                  <option value="">All Statuses</option>
                  {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                    <option key={val} value={val}>{cfg.label}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Priority</label>
                <select
                  value={filters.priority}
                  onChange={e => handleFilterChange("priority", e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
                >
                  <option value="">All Priorities</option>
                  {PRIORITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">City</label>
                <Input
                  placeholder="e.g. Mumbai, Delhi..."
                  value={filters.city}
                  onChange={e => handleFilterChange("city", e.target.value)}
                />
              </div>

              {/* Date From */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Date From</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={e => handleFilterChange("dateFrom", e.target.value)}
                />
              </div>

              {/* Date To */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Date To</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={e => handleFilterChange("dateTo", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">
            {loading ? "Loading..." : <><span className="font-semibold text-slate-900 dark:text-white">{total}</span> results</>}
          </p>
          {/* Sort controls */}
          <div className="flex items-center gap-1">
            {SORT_FIELDS.map(f => (
              <button
                key={f.value}
                onClick={() => toggleSort(f.value)}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-all ${
                  sortBy === f.value
                    ? "bg-primary text-white border-primary"
                    : "border-slate-200 text-slate-500 hover:border-primary/50 hover:text-slate-900 dark:border-slate-700"
                }`}
              >
                {f.label}
                {sortBy === f.value
                  ? sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  : <ArrowUpDown className="h-3 w-3 opacity-50" />
                }
              </button>
            ))}
          </div>
        </div>
        {/* Page size */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Show</span>
          {PAGE_SIZE_OPTIONS.map(sz => (
            <button
              key={sz}
              onClick={() => setPageSize(sz)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                pageSize === sz ? "bg-primary text-white border-primary" : "border-slate-200 hover:border-primary/50 dark:border-slate-700"
              }`}
            >
              {sz}
            </button>
          ))}
          <span>per page</span>
        </div>
      </div>

      {/* Table */}
      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Priority</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Location</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Reported</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading complaints...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-red-500">{error}</td>
                </tr>
              )}
              {!loading && !error && complaints.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
                    No complaints match your filters.
                  </td>
                </tr>
              )}
              {!loading && complaints.map((c, i) => {
                const status = STATUS_CONFIG[c.status]
                const PRIORITY_COLOR: Record<string, string> = {
                  low: "text-slate-600", medium: "text-amber-600", high: "text-orange-600", critical: "text-red-600"
                }
                return (
                  <tr key={c._id} className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30 dark:bg-slate-800/10"}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.complaintId}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="font-medium text-slate-800 dark:text-white truncate">{c.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {CATEGORY_LABELS[c.category] || c.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs font-medium ${status.color} ${status.bg} ${status.border}`}>
                        {status.label}
                      </Badge>
                    </td>
                    <td className={`px-4 py-3 text-xs font-semibold capitalize ${PRIORITY_COLOR[c.priority]}`}>
                      {c.priority}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate">
                      {c.location.city || c.location.address}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/complaint/${c._id || (c as any).id || c.complaintId}/track`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500">
              Page {page} of {pages} &bull; {total} total
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1} className="h-8 w-8 p-0">«</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, pages - 4)) + i
                if (p > pages) return null
                return (
                  <Button key={p} variant={page === p ? "default" : "outline"} size="sm" onClick={() => setPage(p)} className="h-8 w-8 p-0 text-xs">
                    {p}
                  </Button>
                )
              })}
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(pages)} disabled={page === pages} className="h-8 w-8 p-0">»</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
