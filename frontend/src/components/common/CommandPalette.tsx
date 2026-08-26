import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  MapPin,
  Building2,
  Shield,
  BarChart3,
  FileEdit,
  Award,
  HeartHandshake,
  Layers,
  Wrench,
  X,
  CornerDownLeft,
  Navigation,
  Sparkles,
  ShieldAlert,
  Trees,
  Flame,
  Coins,
  Bus,
  Dog,
} from "lucide-react"

interface CommandItem {
  id: string
  title: string
  subtitle: string
  category: "Navigation" | "BMC Wards" | "Departments" | "Quick Actions"
  icon: any
  action: () => void
  badge?: string
}

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: "nav-dashboard",
      title: "Citizen Dashboard",
      subtitle: "Overview of your filed grievances & SLA timelines",
      category: "Navigation",
      icon: Navigation,
      action: () => { navigate("/dashboard"); onClose() },
    },
    {
      id: "nav-map",
      title: "Municipal GIS Map View",
      subtitle: "Live polygon radar across 24 Mumbai administrative wards",
      category: "Navigation",
      icon: MapPin,
      badge: "LIVE GIS",
      action: () => { navigate("/map"); onClose() },
    },
    {
      id: "nav-create",
      title: "File New Civic Grievance",
      subtitle: "Submit camera evidence with AI vision triage",
      category: "Navigation",
      icon: FileEdit,
      badge: "ONNX Vision",
      action: () => { navigate("/complaint/create"); onClose() },
    },
    {
      id: "nav-history",
      title: "Complaint History & Ledger",
      subtitle: "Full tracking history with status progressions",
      category: "Navigation",
      icon: Layers,
      action: () => { navigate("/complaints"); onClose() },
    },
    {
      id: "nav-rewards",
      title: "Civic Hero Karma & Rewards",
      subtitle: "Redeem municipal discount vouchers and tax rebates",
      category: "Navigation",
      icon: Award,
      badge: "₹ Karma",
      action: () => { navigate("/rewards"); onClose() },
    },
    {
      id: "nav-monsoon",
      title: "Monsoon & SWD Flood Radar",
      subtitle: "Waterlogging risk indices, Arabian Sea tides, and pumping stations",
      category: "Navigation",
      icon: MapPin,
      badge: "LIVE RADAR",
      action: () => { navigate("/monsoon-radar"); onClose() },
    },
    {
      id: "nav-dlp",
      title: "DLP Warranty Registry & 3D Sizer",
      subtitle: "36-month contractor liability check and asphalt volume sizing",
      category: "Navigation",
      icon: Shield,
      badge: "DLP LOCK",
      action: () => { navigate("/dlp-registry"); onClose() },
    },
    {
      id: "nav-swm",
      title: "SWM Fleet & RFID Bins",
      subtitle: "Compactor GPS route deviations and hydraulic RFID lift logs",
      category: "Navigation",
      icon: Wrench,
      action: () => { navigate("/swm-fleet"); onClose() },
    },
    {
      id: "nav-budget",
      title: "Participatory Ward Budget",
      subtitle: "Vote on local ward infrastructure funds and corporator ledger",
      category: "Navigation",
      icon: Building2,
      badge: "VOTE",
      action: () => { navigate("/ward-budget"); onClose() },
    },
    {
      id: "nav-trenching",
      title: "Dig Once Trenching Coordinator",
      subtitle: "Multi-utility corridor collision detection & 36M DLP warranty block",
      category: "Navigation",
      icon: Wrench,
      badge: "DIG ONCE",
      action: () => { navigate("/trenching-coordinator"); onClose() },
    },
    {
      id: "nav-aqi",
      title: "AQI & C&D Dust Barricade Radar",
      subtitle: "Construction PM10 micro-sensors & ₹50k stop-work notices",
      category: "Navigation",
      icon: Shield,
      badge: "CLEAN AIR",
      action: () => { navigate("/aqi-enforcement"); onClose() },
    },
    {
      id: "nav-water",
      title: "Non-Revenue Water & Tanker QR Pass",
      subtitle: "DMA differential flow loss & anti-theft tanker manifests",
      category: "Navigation",
      icon: Layers,
      badge: "NRW AUDIT",
      action: () => { navigate("/water-governance"); onClose() },
    },
    {
      id: "nav-subways",
      title: "Flooded Subway Underpasses & Detours",
      subtitle: "30cm inundation flood gate locks & emergency flyover routing",
      category: "Navigation",
      icon: MapPin,
      badge: "30CM GATE",
      action: () => { navigate("/disaster-subways"); onClose() },
    },
    {
      id: "nav-collapse",
      title: "C1 Dilapidated Building Collapse Radar",
      subtitle: "Micro-tiltmeter & crack deflection with transit camp passes",
      category: "Navigation",
      icon: ShieldAlert,
      badge: "C1 TILT",
      action: () => { navigate("/structural-collapse"); onClose() },
    },
    {
      id: "nav-mangroves",
      title: "Mangrove CRZ-I Satellite Sentinel",
      subtitle: "NDVI canopy change detection & cease-and-desist injunctions",
      category: "Navigation",
      icon: Trees,
      badge: "CRZ-I",
      action: () => { navigate("/coastal-sentinel"); onClose() },
    },
    {
      id: "nav-fire",
      title: "High-Rise Fire Safety & Wet-Riser Radar",
      subtitle: "Booster pump pressure sensors & Property Tax citations",
      category: "Navigation",
      icon: Flame,
      badge: "MFB RADAR",
      action: () => { navigate("/fire-safety"); onClose() },
    },
    {
      id: "nav-tax-audit",
      title: "3D Spatial Property Tax & Leakage AI",
      subtitle: "LiDAR 3D envelope discrepancy & 200% penalty demand notices",
      category: "Navigation",
      icon: Coins,
      badge: "3D TAX",
      action: () => { navigate("/property-tax-audit"); onClose() },
    },
    {
      id: "nav-transit",
      title: "BEST Bus Lane ANPR Dashcam Radar",
      subtitle: "Edge bus camera ANPR e-challans & towing dispatch",
      category: "Navigation",
      icon: Bus,
      badge: "ANPR CHAL",
      action: () => { navigate("/best-transit"); onClose() },
    },
    {
      id: "nav-animals",
      title: "Animal Welfare, ABC Drives & Rabies Radar",
      subtitle: "Dispensary bite correlation & mobile sterilization vans",
      category: "Navigation",
      icon: Dog,
      badge: "ABC DRIVE",
      action: () => { navigate("/animal-welfare"); onClose() },
    },
    {
      id: "nav-officer",
      title: "Officer Field Portal",
      subtitle: "Ward task queue, contractor dispatch & rework review",
      category: "Navigation",
      icon: Shield,
      action: () => { navigate("/officer-portal"); onClose() },
    },
    {
      id: "nav-admin",
      title: "Smart City Command Center",
      subtitle: "3-tier SLA escalation, contractor escrow & IoT telemetry",
      category: "Navigation",
      icon: BarChart3,
      badge: "Admin",
      action: () => { navigate("/admin"); onClose() },
    },
    {
      id: "nav-analytics",
      title: "Analytics & Telemetry",
      subtitle: "Department workloads, trends & resolution metrics",
      category: "Navigation",
      icon: BarChart3,
      action: () => { navigate("/admin/analytics"); onClose() },
    },
    {
      id: "nav-donate",
      title: "Civic Community Fund",
      subtitle: "Support neighborhood beautification & road repairs",
      category: "Navigation",
      icon: HeartHandshake,
      action: () => { navigate("/donate"); onClose() },
    },
    {
      id: "nav-worker",
      title: "Field Worker Queue",
      subtitle: "Route optimization, inventory usage & before/after upload",
      category: "Navigation",
      icon: Wrench,
      action: () => { navigate("/worker-queue"); onClose() },
    },

    // BMC Wards
    {
      id: "ward-a",
      title: "Ward A — Colaba, Fort & Marine Drive",
      subtitle: "South Mumbai Heritage & Commercial District",
      category: "BMC Wards",
      icon: MapPin,
      badge: "Zone 1",
      action: () => { navigate("/map?ward=Ward%20A"); onClose() },
    },
    {
      id: "ward-g-south",
      title: "Ward G-South — Worli & Lower Parel",
      subtitle: "Corporate Hub & Coastal Promenade Corridor",
      category: "BMC Wards",
      icon: MapPin,
      badge: "Zone 2",
      action: () => { navigate("/map?ward=Ward%20G-South"); onClose() },
    },
    {
      id: "ward-h-west",
      title: "Ward H-West — Bandra West, Khar & Santa Cruz",
      subtitle: "Western Suburbs Coastal & Retail Belt",
      category: "BMC Wards",
      icon: MapPin,
      badge: "Zone 3",
      action: () => { navigate("/map?ward=Ward%20H-West"); onClose() },
    },
    {
      id: "ward-k-east",
      title: "Ward K-East — Andheri East & MIDC",
      subtitle: "Industrial Corridor & Metro Transit Interchange",
      category: "BMC Wards",
      icon: MapPin,
      badge: "Zone 4",
      action: () => { navigate("/map?ward=Ward%20K-East"); onClose() },
    },

    // Departments
    {
      id: "dept-pwd",
      title: "PWD — Roads & Infrastructure",
      subtitle: "Pothole repair, resurfacing & trench restoration",
      category: "Departments",
      icon: Building2,
      badge: "48h SLA",
      action: () => { navigate("/search?dept=PWD"); onClose() },
    },
    {
      id: "dept-swm",
      title: "SWM — Solid Waste Management",
      subtitle: "Dumpster clearance, bio-waste & street sanitation",
      category: "Departments",
      icon: Building2,
      badge: "24h SLA",
      action: () => { navigate("/search?dept=SWM"); onClose() },
    },
    {
      id: "dept-swd",
      title: "SWD — Storm Water Drains",
      subtitle: "Monsoon desilting & flood mitigation radar",
      category: "Departments",
      icon: Building2,
      badge: "36h SLA",
      action: () => { navigate("/search?dept=SWD"); onClose() },
    },
    {
      id: "dept-wsd",
      title: "WSD — Water Supply & Hydraulics",
      subtitle: "Pipeline bursts, low pressure & water contamination",
      category: "Departments",
      icon: Building2,
      badge: "12h SLA",
      action: () => { navigate("/search?dept=WSD"); onClose() },
    },
    {
      id: "dept-eld",
      title: "ELD — Street Lighting & Electric",
      subtitle: "Dark spot elimination & high-mast mast repairs",
      category: "Departments",
      icon: Building2,
      badge: "24h SLA",
      action: () => { navigate("/search?dept=ELD"); onClose() },
    },
  ], [navigate, onClose])

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.badge && c.badge.toLowerCase().includes(q))
    )
  }, [commands, query])

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery("")
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.1] shadow-2xl shadow-slate-950/30 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] gap-3">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Type a command, ward name, or department..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/40">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-medium">No matching municipal actions found</p>
              <p className="text-xs text-slate-500 mt-1">Try searching "Ward H", "PWD", or "Map"</p>
            </div>
          ) : (
            filteredCommands.map((item, index) => {
              const isSelected = index === selectedIndex
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-slate-900 dark:text-white"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-display truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-sans">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] font-mono uppercase text-slate-400 hidden sm:inline-block">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">↵</kbd> Select
            </span>
          </div>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium font-sans">
            <Sparkles className="w-3 h-3" /> Smart Civic Quick Jump
          </span>
        </div>
      </div>
    </div>
  )
}
export default CommandPalette
