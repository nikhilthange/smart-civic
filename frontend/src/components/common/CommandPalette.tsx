import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  MapPin,
  FileText,
  X,
  CornerDownLeft,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { complaintApi, type Complaint, STATUS_CONFIG } from "@/services/complaintApi"

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<any>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Real-time live grievance search with debouncing
  useEffect(() => {
    if (!isOpen) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await complaintApi.getAll({
          search: trimmed,
          limit: 6,
        })
        const items = Array.isArray(res) ? res : res.complaints || []
        setResults(items)
      } catch (err) {
        console.error("Command palette search error:", err)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 200)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [query, isOpen])

  // Keyboard navigation (Escape, Up/Down, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length + 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + Math.max(1, results.length + 1)) % Math.max(1, results.length + 1))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (results.length > 0 && selectedIndex < results.length) {
          const selected = results[selectedIndex]
          navigate(`/complaint/${selected._id || selected.complaintId}/track`)
          onClose()
        } else if (query.trim()) {
          navigate(`/search?q=${encodeURIComponent(query.trim())}`)
          onClose()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, results, selectedIndex, query, navigate, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] sm:pt-[15vh] px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800 gap-3">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Search tickets by ID (SC-2026-...), issue keyword, or ward..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Results / Suggestions Container */}
        <div className="overflow-y-auto p-2 space-y-1">
          {query.trim() === "" ? (
            <div className="p-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase font-mono">
                <span>Quick Grievance Queries</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Potholes", "Water Leakage", "Garbage Overflow", "Ward H-West", "Ward A", "Streetlight"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 && !isLoading ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                No matching grievance tickets found for &quot;{query}&quot;
              </p>
              <p className="text-xs text-slate-400">
                Try searching by ticket ID (e.g. SC-2026), location, or category
              </p>
              <button
                onClick={() => {
                  navigate(`/complaint/create`)
                  onClose()
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>File New Grievance Instead</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase font-mono">
                Matching Grievance Tickets ({results.length})
              </div>
              {results.map((c, index) => {
                const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.submitted
                const isSelected = selectedIndex === index

                return (
                  <div
                    key={c._id || c.complaintId}
                    onClick={() => {
                      navigate(`/complaint/${c._id || c.complaintId}/track`)
                      onClose()
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-start justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white"
                        : "hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          #{c.complaintId || c._id?.slice(-8)}
                        </span>
                        <span className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
                          {statusCfg.label}
                        </span>
                        {c.priority === "critical" && (
                          <span className="text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                            Critical
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                        {c.title}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{c.location?.address || c.ward || "Mumbai"}</span>
                      </div>
                    </div>

                    <div className="flex items-center self-center shrink-0 text-slate-400">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                )
              })}

              {/* Full Search Page Navigation Link */}
              <div
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(query.trim())}`)
                  onClose()
                }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 border-t border-slate-100 dark:border-zinc-800 mt-2 cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Search className="w-4 h-4" />
                  <span>View all search results in Global Explorer for &quot;{query}&quot;</span>
                </div>
                <CornerDownLeft className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-400 flex items-center justify-between font-sans">
          <span>Search 24 Mumbai Wards & Live Grievance Records</span>
          <span className="hidden sm:inline font-mono">Press ↵ to view ticket</span>
        </div>
      </div>
    </div>
  )
}
