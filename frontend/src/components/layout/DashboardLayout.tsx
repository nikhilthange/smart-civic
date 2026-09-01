import { useState, useEffect, useMemo } from "react"
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
  LineChart,
  Wrench,
  MapPin,
  Command,
  Waves,
  MessageSquare,
  Lock,
  Sparkles,
  Trophy,
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
import { CommandPalette } from "@/components/common/CommandPalette"
import MunicipalSimulatorFloatingWidget from "@/components/common/MunicipalSimulatorFloatingWidget"
import MunicipalCopilotModal from "@/components/admin/MunicipalCopilotModal"
import KeyboardShortcutsModal from "@/components/common/KeyboardShortcutsModal"
import { OnboardingTourModal } from "@/components/common/OnboardingTourModal"
import { LiveWebSocketEventTicker } from "@/components/common/LiveWebSocketEventTicker"
import OfflineSyncBanner from "@/components/common/OfflineSyncBanner"
import { useTranslation } from "react-i18next"
import { triggerHapticFeedback } from "@/utils/haptics"

interface NavItem {
  key: string
  defaultName: string
  href: string
  icon: any
  badge?: string
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
    label: "CORE NAVIGATION",
    items: [
      { key: "nav.dashboard", defaultName: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { key: "nav.mapView", defaultName: "GIS Map Explorer", href: "/map", icon: MapPin, badge: "GIS" },
      { key: "nav.quickReport", defaultName: "Snap & Send (1-Click)", href: "/quick-report", icon: Sparkles, citizenOnly: true, badge: "AI" },
      { key: "nav.createComplaint", defaultName: "File Grievance", href: "/complaint/create", icon: FileEdit, citizenOnly: true },
      { key: "nav.trackComplaint", defaultName: "Track Grievance", href: "/track", icon: Search },
      { key: "nav.complaintHistory", defaultName: "Grievance Ledger", href: "/complaints", icon: History },
      { key: "nav.rewards", defaultName: "Civic Rewards & Karma", href: "/rewards", icon: Trophy, citizenOnly: true },
      { key: "nav.whatsappSandbox", defaultName: "WhatsApp Bot Sandbox", href: "/whatsapp-sandbox", icon: MessageSquare, citizenOnly: true },
      { key: "nav.search", defaultName: "Global Search", href: "/search", icon: Search },
      { key: "nav.settings", defaultName: "Settings & Language", href: "/settings", icon: SettingsIcon },
    ],
  },
  {
    label: "ROLE MANAGEMENT",
    items: [
      { key: "nav.fieldWorker", defaultName: "Field Worker Queue", href: "/worker-queue", icon: Wrench, workerOnly: true, badge: "Field" },
      { key: "nav.officerPortal", defaultName: "Officer Control Room", href: "/officer-portal", icon: Shield, officerOnly: true, badge: "SLA" },
      { key: "nav.adminDashboard", defaultName: "Admin Command", href: "/admin", icon: BarChart3, adminOnly: true },
      { key: "nav.dataStudio", defaultName: "Admin Data Studio", href: "/admin/data-studio", icon: Database, adminOnly: true },
      { key: "nav.analytics", defaultName: "Analytics Telemetry", href: "/admin/analytics", icon: LineChart, adminOnly: true },
      { key: "nav.monsoon", defaultName: "Monsoon Flood Radar", href: "/monsoon-radar", icon: Waves, badge: "Live" },
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

  // Mobile Bottom Navigation items tailored to current role
  const mobileNavItems = useMemo(() => {
    const role = user?.role || "citizen"
    if (role === "worker") {
      return [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "My Queue", href: "/worker-queue", icon: Wrench, isPrimaryAction: true },
        { name: "GIS Map", href: "/map", icon: MapPin },
        { name: "Ledger", href: "/complaints", icon: History },
        { name: "Settings", href: "/settings", icon: SettingsIcon },
      ]
    }
    if (role === "officer") {
      return [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Control", href: "/officer-portal", icon: Shield, isPrimaryAction: true },
        { name: "GIS Map", href: "/map", icon: MapPin },
        { name: "Monsoon", href: "/monsoon-radar", icon: Waves },
        { name: "Ledger", href: "/complaints", icon: History },
      ]
    }
    if (role === "admin") {
      return [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Command", href: "/admin", icon: BarChart3, isPrimaryAction: true },
        { name: "GIS Map", href: "/map", icon: MapPin },
        { name: "Data Studio", href: "/admin/data-studio", icon: Database },
        { name: "Ledger", href: "/complaints", icon: History },
      ]
    }
    // Default Citizen Role
    return [
      { name: "Home", href: "/dashboard", icon: LayoutDashboard },
      { name: "GIS Map", href: "/map", icon: MapPin },
      { name: "Report", href: "/quick-report", icon: Sparkles, isPrimaryAction: true },
      { name: "Ledger", href: "/complaints", icon: History },
      { name: "Rewards", href: "/rewards", icon: Trophy },
    ]
  }, [user?.role])

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
            <div className="flex items-center justify-between gap-1">
              <Badge
                variant="outline"
                className={`text-[10px] capitalize font-mono font-medium px-2 py-0.5 rounded-md border ${roleBadgeColor[user.role] || ""}`}
              >
                <Shield className="h-2.5 w-2.5 mr-1" />
                {user.role}
              </Badge>
              {user?.role === "citizen" && (
                <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  <span>{user?.karmaPoints || 0} pts</span>
                </div>
              )}
            </div>
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
                        <span className="truncate flex-1">{t(item.key, item.defaultName)}</span>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border transition-colors ${
                              isActive
                                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-600"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-700/80"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
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

        {/* Main Content Container: Smooth Natural Vertical Scroll for All Views */}
        <main className="w-full max-w-full overflow-x-hidden flex-1 overflow-y-auto overscroll-y-contain px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] lg:pb-12">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6"
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Mobile Glassmorphic Bottom Navigation Bar */}
        <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-t border-zinc-200/80 dark:border-zinc-800/80 px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.4rem)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {mobileNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              if (item.isPrimaryAction) {
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => triggerHapticFeedback("medium")}
                    className="flex flex-col items-center relative -top-3.5 group touch-manipulation focus:outline-hidden"
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/35 border-2 border-white dark:border-zinc-900"
                    >
                      <Icon className="w-5 h-5 animate-pulse" />
                    </motion.div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                      {item.name}
                    </span>
                  </Link>
                )
              }

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => triggerHapticFeedback("light")}
                  className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[52px] min-h-[44px] transition-all relative touch-manipulation focus:outline-hidden ${
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400 font-bold"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileActiveNavPill"
                      className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
                  <span className="text-[10px] tracking-tight mt-0.5 relative z-10 leading-none">
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Floating Global Simulator Widget, Copilot Modal, Onboarding Tour & Keyboard Shortcuts */}
        <MunicipalSimulatorFloatingWidget />
        <MunicipalCopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
        <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
        <OnboardingTourModal />
      </div>
    </div>
  )
}
