import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  MapPin,
  FileText,
  X,
  CornerDownLeft,
  Loader2,
  ArrowRight,
  LayoutDashboard,
  Camera,
  PlusCircle,
  CloudRain,
  Radio,
  Wrench,
  ShieldAlert,
  Building,
  Coins,
  MessageSquare,
  Database,
  BarChart3,
  Shield,
  Users,
  Trophy,
  LifeBuoy,
  Settings,
  Sparkles,
  Scale,
  QrCode,
} from "lucide-react"
import { complaintApi, type Complaint, STATUS_CONFIG } from "@/services/complaintApi"

interface NavPageItem {
  title: string
  href: string
  category: string
  keywords: string[]
  icon: any
  badge?: string
}

const PLATFORM_NAV_PAGES: NavPageItem[] = [
  { title: "Dashboard Overview", href: "/dashboard", category: "Core", keywords: ["home", "stats", "overview"], icon: LayoutDashboard },
  { title: "⚡ 1-Click Snap & Send", href: "/quick-report", category: "Citizen Portal", keywords: ["snap", "camera", "quick", "report", "ai triage"], icon: Camera, badge: "AI Fast" },
  { title: "File Grievance (Detailed)", href: "/complaint/create", category: "Citizen Portal", keywords: ["create", "new", "file", "complaint", "form"], icon: PlusCircle },
  { title: "Track Grievance SLA", href: "/track", category: "Citizen Portal", keywords: ["track", "status", "sla", "countdown"], icon: Search },
  { title: "Live Ward GIS Map", href: "/map", category: "GIS & Maps", keywords: ["map", "gis", "wards", "heatmap", "choropleth"], icon: MapPin },
  { title: "Road Birth Certificate (QR)", href: "/road-passport", category: "Citizen Portal", keywords: ["road", "passport", "qr", "dlp", "contractor", "warranty"], icon: QrCode },
  { title: "Monsoon Flood Radar", href: "/monsoon-radar", category: "Disaster & Emergency", keywords: ["monsoon", "flood", "rain", "tide", "waterlogging"], icon: CloudRain, badge: "Live" },
  { title: "Daily SITREP Operations Briefing", href: "/sitrep", category: "Command & Operations", keywords: ["sitrep", "briefing", "daily", "executive", "pdf"], icon: FileText, badge: "PDF Seal" },
  { title: "Emergency Disaster Broadcast Hub", href: "/emergency-broadcast", category: "Disaster & Emergency", keywords: ["broadcast", "emergency", "siren", "sms", "alert"], icon: Radio, badge: "Siren" },
  { title: "Contractor 3-Strike Blacklist & Escrow", href: "/contractor-registry", category: "Governance & Finance", keywords: ["contractor", "escrow", "blacklist", "penalty", "strike"], icon: ShieldAlert },
  { title: "RTS Statutory Officer Salary Penalty Ledger", href: "/rts-enforcement", category: "Governance & Finance", keywords: ["rts", "right to service", "salary deduction", "penalty", "show cause"], icon: Scale, badge: "Act 2015" },
  { title: "ALM Housing Society Governance", href: "/alm-societies", category: "Citizen & ALM", keywords: ["alm", "society", "housing", "waste", "rebate"], icon: Building },
  { title: "Participatory Ward Budget Voting", href: "/ward-budget", category: "Citizen & ALM", keywords: ["budget", "participatory", "funds", "voting", "ward"], icon: Coins },
  { title: "Municipal Data Studio & SQL Query", href: "/admin/data-studio", category: "Command & Operations", keywords: ["data studio", "sql", "ai training", "dlq", "database"], icon: Database },
  { title: "Executive Command Admin Console", href: "/admin", category: "Command & Operations", keywords: ["admin", "executive", "command", "officers", "staff"], icon: BarChart3 },
  { title: "Ward Officer Operations Portal", href: "/officer-portal", category: "Command & Operations", keywords: ["officer", "portal", "kanban", "triage", "field"], icon: Shield },
  { title: "Field Worker Task Queue", href: "/worker-queue", category: "Command & Operations", keywords: ["worker", "field", "queue", "repair", "proof"], icon: Wrench },
  { title: "Find My Ward Nagarsevak", href: "/nagarsevak", category: "Citizen Portal", keywords: ["nagarsevak", "corporator", "ward councillor", "representative"], icon: Users },
  { title: "Civic Karma & Rewards Redemption", href: "/rewards", category: "Citizen Portal", keywords: ["rewards", "karma", "vouchers", "tax rebate", "points"], icon: Trophy },
  { title: "WhatsApp Citizen Bot Sandbox", href: "/whatsapp-sandbox", category: "Citizen Portal", keywords: ["whatsapp", "bot", "chat", "voice note", "webhook"], icon: MessageSquare },
  { title: "Citizen Support & Emergency Helplines", href: "/support", category: "Citizen Portal", keywords: ["support", "help", "emergency", "1916", "faq"], icon: LifeBuoy },
  { title: "Profile & Account Settings", href: "/settings", category: "Core", keywords: ["settings", "profile", "password", "theme", "language"], icon: Settings },
]

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


  const matchedPages = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      // Top recommended default quick actions
      return PLATFORM_NAV_PAGES.filter(p => [
        "/quick-report",
        "/map",
        "/track",
        "/monsoon-radar",
        "/sitrep",
        "/nagarsevak",
      ].includes(p.href))
    }
    return PLATFORM_NAV_PAGES.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.keywords.some((k) => k.toLowerCase().includes(q))
    ).slice(0, 6)
  }, [query])

  const totalInteractiveItems = matchedPages.length + results.length

  // Keyboard navigation (Escape, Up/Down, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalInteractiveItems))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + Math.max(1, totalInteractiveItems)) % Math.max(1, totalInteractiveItems))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (selectedIndex < matchedPages.length) {
          const selectedPage = matchedPages[selectedIndex]
          if (selectedPage) {
            navigate(selectedPage.href)
            onClose()
          }
        } else {
          const ticketIndex = selectedIndex - matchedPages.length
          if (results.length > 0 && ticketIndex < results.length) {
            const selected = results[ticketIndex]
            navigate(`/complaint/${selected._id || selected.complaintId}/track`)
            onClose()
          } else if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`)
            onClose()
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, results, matchedPages, selectedIndex, totalInteractiveItems, query, navigate, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[12vh] px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[80vh]"
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
            placeholder="Search all 35+ CityOS tools, radar modules, or tickets (SC-2026-..., pothole)..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none font-medium"
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
        <div className="overflow-y-auto p-2 space-y-3">
          {/* Section 1: Matched CityOS Radars, Tools & Dashboards */}
          {matchedPages.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase font-mono flex items-center justify-between">
                <span>{query.trim() ? "CityOS Radars & Tools" : "Recommended Quick Launch"}</span>
                <span className="text-[10px]">{matchedPages.length} Modules</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 px-1">
                {matchedPages.map((page, index) => {
                  const isSelected = selectedIndex === index
                  const Icon = page.icon
                  return (
                    <div
                      key={page.href}
                      onClick={() => {
                        navigate(page.href)
                        onClose()
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors border ${
                        isSelected
                          ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-100"
                          : "border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300"
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold truncate">{page.title}</p>
                          {page.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                              {page.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">{page.category}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section 2: Ticket Quick Filters (when query is empty) */}
          {query.trim() === "" && (
            <div className="p-3 bg-slate-50/60 dark:bg-zinc-800/30 rounded-xl border border-slate-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Search Live Mumbai Grievance Records</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Potholes", "Water Leakage", "Garbage Dump", "Ward H-West", "Ward A", "Broken Streetlight"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Grievance Results */}
          {query.trim() !== "" && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase font-mono flex items-center justify-between">
                <span>Matching Grievance Tickets</span>
                <span>{results.length} found</span>
              </div>

              {results.length === 0 && !isLoading ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No matching tickets for &quot;{query}&quot;. You can launch one of the CityOS modules above or search all records below.
                </div>
              ) : (
                results.map((c, index) => {
                  const globalIdx = matchedPages.length + index
                  const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.submitted
                  const isSelected = selectedIndex === globalIdx

                  return (
                    <div
                      key={c._id || c.complaintId}
                      onClick={() => {
                        navigate(`/complaint/${c._id || c.complaintId}/track`)
                        onClose()
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
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
                })
              )}

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
                  <span>View full search results in Global Explorer for &quot;{query}&quot;</span>
                </div>
                <CornerDownLeft className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-400 flex items-center justify-between font-sans">
          <span>Search 35+ CityOS tools & 24 Mumbai Wards</span>
          <span className="hidden sm:inline font-mono">Press ↑↓ to navigate · ↵ to open</span>
        </div>
      </div>
    </div>
  )
}
