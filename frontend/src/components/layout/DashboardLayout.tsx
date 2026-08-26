import { useState, useEffect } from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import {
  Building2,
  LayoutDashboard,
  FileEdit,
  History,
  LogOut,
  Menu,
  Search,
  Shield,
  BarChart3,
  HeartHandshake,
  LineChart,
  Wrench,
  MapPin,
  Award,
  Command,
  Waves,
  ShieldAlert,
  Truck,
  Coins,
  Pickaxe,
  Wind,
  Droplets,
  Flame,
  Trees,
  Bus,
  Dog,
  MessageSquare,
  Lock,
  Sparkles,
  Cctv,
  Layers,
  Leaf,
  Trophy,
  Radio,
  Gavel,
  Building,
  FileText,
  Megaphone,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/AuthContext"
import toast from "react-hot-toast"
import { NotificationBell } from "@/components/ui/NotificationBell"
import LanguageSelector from "@/components/common/LanguageSelector"
import CommandPalette from "@/components/common/CommandPalette"
import OfflineSyncBanner from "@/components/common/OfflineSyncBanner"
import MunicipalSimulatorFloatingWidget from "@/components/common/MunicipalSimulatorFloatingWidget"
import MunicipalCopilotModal from "@/components/admin/MunicipalCopilotModal"
import { LiveWebSocketEventTicker } from "@/components/common/LiveWebSocketEventTicker"
import KeyboardShortcutsModal from "@/components/common/KeyboardShortcutsModal"
import { OnboardingTourModal } from "@/components/common/OnboardingTourModal"
import { useViewMode } from "@/context/ViewModeContext"
import { useTranslation } from "react-i18next"

interface NavItem {
  key: string
  defaultName: string
  href: string
  icon: any
  citizenOnly?: boolean
  workerOnly?: boolean
  officerOnly?: boolean
  adminOnly?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "MENU",
    items: [
      { key: "nav.dashboard", defaultName: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { key: "nav.quickReport", defaultName: "Snap & Send (1-Click)", href: "/quick-report", icon: Sparkles, citizenOnly: true },
      { key: "nav.mapView", defaultName: "Map View", href: "/map", icon: MapPin },
      { key: "nav.whatsappSandbox", defaultName: "WhatsApp Bot Sandbox", href: "/whatsapp-sandbox", icon: MessageSquare },
      { key: "nav.createComplaint", defaultName: "Create Grievance", href: "/complaint/create", icon: FileEdit, citizenOnly: true },
      { key: "nav.complaintHistory", defaultName: "Complaint Ledger", href: "/complaints", icon: History },
      { key: "nav.rewards", defaultName: "Civic Rewards", href: "/rewards", icon: Award },
      { key: "nav.search", defaultName: "Search Tickets", href: "/search", icon: Search },
      { key: "nav.donations", defaultName: "Community Fund", href: "/donate", icon: HeartHandshake },
    ],
  },
  {
    label: "MUNICIPAL RADAR",
    items: [
      { key: "nav.monsoon", defaultName: "Monsoon Flood Radar", href: "/monsoon-radar", icon: Waves },
      { key: "nav.dlp", defaultName: "DLP Warranty & 3D Sizer", href: "/dlp-registry", icon: ShieldAlert },
      { key: "nav.swmFleet", defaultName: "SWM Fleet & RFID Bins", href: "/swm-fleet", icon: Truck },
      { key: "nav.wardBudget", defaultName: "Participatory Budget", href: "/ward-budget", icon: Coins },
      { key: "nav.trenching", defaultName: "Dig Once Trenching", href: "/trenching-coordinator", icon: Pickaxe },
      { key: "nav.aqi", defaultName: "AQI & C&D Dust Barricade", href: "/aqi-enforcement", icon: Wind },
      { key: "nav.water", defaultName: "NRW Water & Tanker QR", href: "/water-governance", icon: Droplets },
      { key: "nav.subways", defaultName: "Flooded Subway Detours", href: "/disaster-subways", icon: Waves },
    ],
  },
  {
    label: "CITY OPERATING SYSTEM",
    items: [
      { key: "nav.cctv", defaultName: "CCTV Video Analytics", href: "/cctv-surveillance", icon: Cctv },
      { key: "nav.socialRadar", defaultName: "Social Media & X Radar", href: "/social-radar", icon: Radio },
      { key: "nav.civicKarma", defaultName: "Civic Karma & Rewards", href: "/civic-karma", icon: Trophy },
      { key: "nav.digitalTwin", defaultName: "3D Digital Twin Runoff", href: "/digital-twin", icon: Layers },
      { key: "nav.greenBonds", defaultName: "Green Bonds & CapEx", href: "/green-bonds", icon: Leaf },
      { key: "nav.sitrep", defaultName: "Daily Executive SITREP", href: "/sitrep", icon: FileText },
      { key: "nav.emergencyBroadcast", defaultName: "Emergency Geo-Broadcast", href: "/emergency-broadcast", icon: Megaphone },
      { key: "nav.contractors", defaultName: "Contractor 3-Strike Ledger", href: "/contractor-registry", icon: Gavel },
      { key: "nav.almSocieties", defaultName: "ALM Society Governance", href: "/alm-societies", icon: Building },
      { key: "nav.collapse", defaultName: "C1 Building Collapse Radar", href: "/structural-collapse", icon: ShieldAlert },
      { key: "nav.mangroves", defaultName: "Mangrove CRZ-I Sentinel", href: "/coastal-sentinel", icon: Trees },
      { key: "nav.fire", defaultName: "High-Rise Fire Wet-Riser", href: "/fire-safety", icon: Flame },
      { key: "nav.taxAudit", defaultName: "3D Property Tax AI", href: "/property-tax-audit", icon: Coins },
      { key: "nav.transit", defaultName: "BEST Bus Lane ANPR", href: "/best-transit", icon: Bus },
      { key: "nav.animals", defaultName: "Animal ABC & Rabies Radar", href: "/animal-welfare", icon: Dog },
    ],
  },
  {
    label: "PORTALS & GOVERNANCE",
    items: [
      { key: "nav.auditLedger", defaultName: "Tamper-Evident Audit", href: "/audit-ledger", icon: Lock, adminOnly: true },
      { key: "nav.fieldWorker", defaultName: "Field Worker Queue", href: "/worker-queue", icon: Wrench, workerOnly: true },
      { key: "nav.officerPortal", defaultName: "Officer Portal", href: "/officer-portal", icon: Shield, officerOnly: true },
      { key: "nav.adminDashboard", defaultName: "Admin Command", href: "/admin", icon: BarChart3, adminOnly: true },
      { key: "nav.analytics", defaultName: "Analytics Telemetry", href: "/admin/analytics", icon: LineChart, adminOnly: true },
    ],
  },
]

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isCopilotOpen, setIsCopilotOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const { isEasyView, toggleEasyView } = useViewMode()

  // Global Cmd+K / Ctrl+K & ? Hotkey listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      } else if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault()
        setIsShortcutsOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate("/auth", { replace: true })
  }

  // Get initials for avatar fallback
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  const roleBadgeColor: Record<string, string> = {
    admin: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    officer: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    worker: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    citizen: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col py-4">
      <div className="flex h-14 items-center px-5 lg:h-[60px] lg:px-6 mb-2">
        <Link to="/" className="flex items-center gap-3 font-semibold transition-transform hover:scale-[1.02]">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-2 rounded-xl shadow-sm shadow-emerald-500/30">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight font-display text-slate-900 dark:text-white">Smart Civic</span>
            <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-600 dark:text-emerald-400 font-bold -mt-1">Enterprise AI</span>
          </div>
        </Link>
      </div>

      {/* User identity card */}
      {user && (
        <div className="mx-4 mb-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 p-3 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
            {user.name}
          </p>
          <p className="text-[11px] text-slate-500 truncate mb-2">{user.email}</p>
          <Badge
            variant="outline"
            className={`text-[10px] capitalize font-mono font-medium px-2 py-0.5 rounded-md border ${roleBadgeColor[user.role] || ""}`}
          >
            <Shield className="h-2.5 w-2.5 mr-1" />
            {user.role}
          </Badge>
        </div>
      )}

      {/* Grouped Navigation */}
      <div className="flex-1 overflow-y-auto px-3 space-y-5">
        {navGroups.map((group) => {
          // Filter items based on user role
          const visibleItems = group.items.filter((item) => {
            const isCitizen = user?.role === "citizen"
            const isAdmin = user?.role === "admin"
            const isOfficerOrAdmin = ["admin", "officer"].includes(user?.role ?? "")
            const isWorkerOfficerAdmin = ["admin", "officer", "worker"].includes(user?.role ?? "")

            if (item.citizenOnly && !isCitizen) return false
            if (item.adminOnly && !isAdmin) return false
            if (item.officerOnly && !isOfficerOrAdmin) return false
            if (item.workerOnly && !isWorkerOfficerAdmin) return false
            return true
          })

          if (visibleItems.length === 0) return null

          return (
            <div key={group.label} className="space-y-1">
              <p className="px-3 text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
              <nav className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    location.pathname === item.href ||
                    (item.href === "/complaint/create" &&
                      (location.pathname === "/complaint/new" ||
                        location.pathname === "/create-complaint")) ||
                    (item.href === "/worker-queue" &&
                      (location.pathname === "/worker-dashboard" ||
                        location.pathname === "/worker/dashboard")) ||
                    (item.href === "/officer-portal" &&
                      (location.pathname === "/officer" ||
                        location.pathname === "/officer-dashboard" ||
                        location.pathname === "/officer/dashboard")) ||
                    (item.href === "/admin" &&
                      (location.pathname === "/admin-dashboard" ||
                        location.pathname === "/admin/dashboard"))

                  return (
                    <Link
                      key={item.key}
                      to={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold border-r-2 border-emerald-600 shadow-sm"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.04]"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-400 group-hover:text-emerald-600"
                        }`}
                      />
                      <span className="truncate">{t(item.key, item.defaultName)}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          )
        })}
      </div>

      <div className="mt-auto px-4 py-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/[0.06]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
            BMC System Online • Ward H-West
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50/50 dark:bg-[#030712]">
      {/* Global Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Permanent Fixed Sidebar */}
      <div className="hidden md:block shrink-0 w-[250px] lg:w-[265px] h-full border-r border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden min-w-0">
        {/* Real-Time WebSocket Event Stream Ticker */}
        <LiveWebSocketEventTicker />

        {/* Offline Sync Banner */}
        <OfflineSyncBanner />

        {/* Permanent Fixed Top Header */}
        <header className="shrink-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 lg:px-8 shadow-sm shadow-slate-950/[0.02]">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>

          {/* Desktop Search Button */}
          <div className="hidden md:flex w-full flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800/60 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700/60 transition-all group"
            >
              <span className="flex items-center gap-2.5">
                <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                <span className="truncate">Search commands, wards, or tickets...</span>
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <Command className="w-3 h-3" /> K
              </kbd>
            </button>
          </div>

          {/* Mobile 1-Tap Search Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="md:hidden text-zinc-500"
            title="Search (⌘K)"
          >
            <Search className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-3 ml-auto">
            {/* Accessibility: Easy View Toggle */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleEasyView}
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full text-xs font-semibold shadow-sm transition-all ${
                isEasyView
                  ? "bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-md shadow-amber-500/20"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isEasyView ? "Easy View: ON" : "Easy View"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCopilotOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full text-xs font-semibold border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>AI Copilot</span>
            </Button>

            <LanguageSelector />
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold font-mono">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs font-normal text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsCommandPaletteOpen(true)}>
                  <Command className="mr-2 h-4 w-4 text-emerald-600" />
                  Command Palette (⌘K)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsCopilotOpen(true)}>
                  <Sparkles className="mr-2 h-4 w-4 text-violet-600" />
                  Municipal AI Copilot
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast("Settings coming soon!", { icon: "⚙️" })}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast("Support portal coming soon!", { icon: "🎧" })}>
                  Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Container: Full-Bleed for GIS / Radars, Standard Max-W-7xl for Dashboards */}
        {(() => {
          const FULL_BLEED_PREFIXES = [
            "/map",
            "/digital-twin",
            "/cctv",
            "/monsoon-radar",
            "/worker-queue",
            "/worker-dashboard",
            "/worker/dashboard",
            "/best-transit",
          ]
          const isFullBleed = FULL_BLEED_PREFIXES.some((prefix) =>
            location.pathname.startsWith(prefix)
          )

          if (isFullBleed) {
            return (
              <main className="flex-1 w-full h-[calc(100dvh-4rem)] p-0 m-0 overflow-hidden relative overscroll-none bg-transparent">
                <Outlet />
              </main>
            )
          }

          return (
            <main className="flex-1 overflow-y-auto overscroll-y-contain bg-transparent">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <Outlet />
              </div>
            </main>
          )
        })()}

        {/* Floating Global Simulator Widget, Copilot Modal, Onboarding Tour & Keyboard Shortcuts */}
        <MunicipalSimulatorFloatingWidget />
        <MunicipalCopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
        <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
        <OnboardingTourModal />
      </div>
    </div>
  )
}
