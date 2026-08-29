import { useState, useEffect } from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Building2,
  Database,
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
  Settings as SettingsIcon,
  LifeBuoy,
  X,
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
    label: "CORE CIVIC WORKFLOWS",
    items: [
      { key: "nav.dashboard", defaultName: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { key: "nav.quickReport", defaultName: "Snap & Send (1-Click)", href: "/quick-report", icon: Sparkles, citizenOnly: true },
      { key: "nav.createComplaint", defaultName: "Create Grievance", href: "/complaint/create", icon: FileEdit, citizenOnly: true },
      { key: "nav.trackComplaint", defaultName: "Track Grievance", href: "/track", icon: Search },
      { key: "nav.complaintHistory", defaultName: "Grievance Ledger", href: "/complaints", icon: History },
      { key: "nav.mapView", defaultName: "GIS Map Explorer", href: "/map", icon: MapPin },
      { key: "nav.donations", defaultName: "Community Fund & 80G", href: "/donate", icon: HeartHandshake },
      { key: "nav.rewards", defaultName: "Civic Rewards & Karma", href: "/rewards", icon: Trophy },
      { key: "nav.whatsappSandbox", defaultName: "WhatsApp Bot Sandbox", href: "/whatsapp-sandbox", icon: MessageSquare },
      { key: "nav.search", defaultName: "Global Search", href: "/search", icon: Search },
    ],
  },
  {
    label: "MUNICIPAL RADAR & SURVEILLANCE",
    items: [
      { key: "nav.monsoon", defaultName: "Monsoon Flood Radar", href: "/monsoon-radar", icon: Waves },
      { key: "nav.subways", defaultName: "Flooded Subway Detours", href: "/disaster-subways", icon: Waves },
      { key: "nav.fire", defaultName: "High-Rise Fire Wet-Riser", href: "/fire-safety", icon: Flame },
      { key: "nav.collapse", defaultName: "C1 Building Collapse Radar", href: "/structural-collapse", icon: ShieldAlert },
      { key: "nav.emergencyBroadcast", defaultName: "Emergency Geo-Broadcast", href: "/emergency-broadcast", icon: Megaphone },
      { key: "nav.dlp", defaultName: "DLP Road Warranty 3D", href: "/dlp-registry", icon: ShieldAlert },
      { key: "nav.swmFleet", defaultName: "SWM Fleet & RFID Bins", href: "/swm-fleet", icon: Truck },
      { key: "nav.trenching", defaultName: "Dig Once Trenching", href: "/trenching-coordinator", icon: Pickaxe },
      { key: "nav.water", defaultName: "NRW Water & Tanker QR", href: "/water-governance", icon: Droplets },
      { key: "nav.aqi", defaultName: "AQI & Dust Barricade", href: "/aqi-enforcement", icon: Wind },
      { key: "nav.mangroves", defaultName: "Mangrove CRZ-I Sentinel", href: "/coastal-sentinel", icon: Trees },
      { key: "nav.animals", defaultName: "Animal ABC & Rabies Radar", href: "/animal-welfare", icon: Dog },
      { key: "nav.transit", defaultName: "BEST Bus Lane ANPR", href: "/best-transit", icon: Bus },
      { key: "nav.cctv", defaultName: "CCTV Video Analytics", href: "/cctv-surveillance", icon: Cctv },
      { key: "nav.socialRadar", defaultName: "Social Media & X Radar", href: "/social-radar", icon: Radio },
      { key: "nav.digitalTwin", defaultName: "3D Digital Twin Runoff", href: "/digital-twin", icon: Layers },
      { key: "nav.wardBudget", defaultName: "Participatory Budget", href: "/ward-budget", icon: Coins },
      { key: "nav.taxAudit", defaultName: "3D Property Tax AI", href: "/property-tax-audit", icon: Coins },
      { key: "nav.greenBonds", defaultName: "Green Bonds & CapEx", href: "/green-bonds", icon: Leaf },
      { key: "nav.contractors", defaultName: "Contractor 3-Strike Ledger", href: "/contractor-registry", icon: Gavel },
      { key: "nav.almSocieties", defaultName: "ALM Society Governance", href: "/alm-societies", icon: Building },
      { key: "nav.sitrep", defaultName: "Daily Executive SITREP", href: "/sitrep", icon: FileText },
    ],
  },
  {
    label: "PORTALS & GOVERNANCE",
    items: [
      { key: "nav.fieldWorker", defaultName: "Field Worker Queue", href: "/worker-queue", icon: Wrench, workerOnly: true },
      { key: "nav.officerPortal", defaultName: "Officer Portal", href: "/officer-portal", icon: Shield, officerOnly: true },
      { key: "nav.adminDashboard", defaultName: "Admin Command", href: "/admin", icon: BarChart3, adminOnly: true },
      { key: "nav.dataStudio", defaultName: "Admin Data Studio", href: "/admin/data-studio", icon: Database, adminOnly: true },
      { key: "nav.analytics", defaultName: "Analytics Telemetry", href: "/admin/analytics", icon: LineChart, adminOnly: true },
      { key: "nav.auditLedger", defaultName: "Tamper-Evident Audit", href: "/audit-ledger", icon: Lock, adminOnly: true },
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
    officer: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    worker: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    citizen: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  }

  const Sidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex h-full flex-col bg-white dark:bg-[#090A0F]">
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#090A0F]/95 backdrop-blur-md flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        {/* Brand Identity */}
        <Link
          to="/"
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
          className="flex items-center gap-2.5 min-w-0 font-semibold transition-opacity hover:opacity-80"
        >
          <div className="bg-primary/10 p-2 rounded-xl text-primary shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none truncate">
              Smart Civic
            </h1>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 tracking-wider uppercase">
              Enterprise AI
            </span>
          </div>
        </Link>

        {/* Sleek Close Button */}
        {isMobile && (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {/* User identity card */}
        {user && (
          <div className="mx-3.5 mb-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 p-3 border border-zinc-200/70 dark:border-zinc-800/70">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mb-2">{user.email}</p>
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
        <div className="px-2.5 space-y-4">
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
              <div key={group.label} className="space-y-0.5">
                <p className="px-3 text-[10px] font-semibold font-mono tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
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
                        className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 sm:py-2 text-sm sm:text-xs font-medium transition-colors min-h-[44px] sm:min-h-[36px] ${
                          isActive
                            ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {isActive && (
                          <motion.div
                            layoutId={isMobile ? "mobile-sidebar-active-pill" : "desktop-sidebar-active-pill"}
                            className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg -z-10 border border-zinc-200/50 dark:border-zinc-700/50"
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                        <item.icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive
                              ? "text-zinc-900 dark:text-zinc-100"
                              : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
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
      </div>

      <div className="mt-auto px-4 py-3 border-t border-zinc-200/60 dark:border-zinc-800/60 shrink-0">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
            BMC System Online • Ward H-West
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] w-full max-w-full overflow-hidden bg-[#FAFAFA] dark:bg-[#090A0F]">
      {/* Global Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Permanent Fixed Sidebar */}
      <div className="hidden md:block shrink-0 w-[240px] lg:w-[255px] h-full border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#090A0F]/70 backdrop-blur-xl">
        <Sidebar isMobile={false} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden min-w-0 w-full max-w-full">
        {/* Real-Time WebSocket Event Stream Ticker */}
        <LiveWebSocketEventTicker />

        {/* Offline Sync Banner */}
        <OfflineSyncBanner />

        {/* Permanent Fixed Top Header */}
        <header className="shrink-0 z-40 flex h-14 items-center gap-2 sm:gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#090A0F]/70 backdrop-blur-xl px-3 sm:px-6 lg:px-8 shadow-sm w-full max-w-full">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="shrink-0 md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl cursor-pointer pointer-events-auto hover:bg-slate-100 dark:hover:bg-slate-800 touch-manipulation"
                aria-label="Toggle navigation menu"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" hideCloseButton className="flex flex-col p-0 w-[280px] max-w-[85vw] z-[70]">
              <Sidebar isMobile={true} />
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
            className="md:hidden text-zinc-500 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer pointer-events-auto touch-manipulation"
            title="Search (⌘K)"
          >
            <Search className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
            {/* Accessibility: Easy View Toggle */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleEasyView}
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full text-xs font-semibold shadow-sm transition-all min-h-[36px] ${
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
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full text-xs font-semibold border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 shadow-sm min-h-[36px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>AI Copilot</span>
            </Button>

            <LanguageSelector />
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full min-h-[44px] min-w-[44px] touch-manipulation">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold font-mono">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 z-[70]">
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
                  <Command className="mr-2 h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                  Command Palette (⌘K)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsCopilotOpen(true)}>
                  <Sparkles className="mr-2 h-4 w-4 text-violet-600" />
                  Municipal AI Copilot
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                  <SettingsIcon className="mr-2 h-4 w-4 text-slate-500" />
                  Settings & Preferences
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/support")} className="cursor-pointer">
                  <LifeBuoy className="mr-2 h-4 w-4 text-blue-500" />
                  Civic Helpdesk & Support
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
              <main className="flex-1 w-full h-[calc(100dvh-3.5rem)] p-0 m-0 overflow-hidden relative overscroll-none bg-transparent">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="w-full h-full"
                >
                  <Outlet />
                </motion.div>
              </main>
            )
          }

          return (
            <main
              className="flex-1 overflow-y-auto overscroll-y-contain bg-transparent"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
            >
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 sm:pb-12 space-y-4 sm:space-y-6"
              >
                <Outlet />
              </motion.div>
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
