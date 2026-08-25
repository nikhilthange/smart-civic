import { useState } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

const navItems: NavItem[] = [
  { key: "nav.dashboard", defaultName: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "nav.mapView", defaultName: "Map View", href: "/map", icon: MapPin },
  { key: "nav.createComplaint", defaultName: "Create Complaint", href: "/complaint/create", icon: FileEdit, citizenOnly: true },
  { key: "nav.complaintHistory", defaultName: "Complaint History", href: "/complaints", icon: History },
  { key: "nav.rewards", defaultName: "Civic Hero Rewards", href: "/rewards", icon: Award },
  { key: "nav.search", defaultName: "Search", href: "/search", icon: Search },
  { key: "nav.donations", defaultName: "Donations", href: "/donate", icon: HeartHandshake },
  { key: "nav.fieldWorker", defaultName: "Field Worker Queue", href: "/worker-queue", icon: Wrench, workerOnly: true },
  { key: "nav.officerPortal", defaultName: "Officer Portal", href: "/officer-portal", icon: Shield, officerOnly: true },
  { key: "nav.adminDashboard", defaultName: "Admin Dashboard", href: "/admin", icon: BarChart3, adminOnly: true },
  { key: "nav.analytics", defaultName: "Analytics", href: "/admin/analytics", icon: LineChart, adminOnly: true },
]

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { t } = useTranslation()

  const handleLogout = async () => {
    await logout()
    navigate("/auth", { replace: true })
  }

  // Get initials for avatar fallback
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  const roleBadgeColor: Record<string, string> = {
    admin: "bg-red-100 text-red-700 border-red-200",
    officer: "bg-blue-100 text-blue-700 border-blue-200",
    worker: "bg-amber-100 text-amber-700 border-amber-200",
    citizen: "bg-green-100 text-green-700 border-green-200",
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col gap-4 py-4">
      <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6 mb-2">
        <Link to="/" className="flex items-center gap-3 font-semibold transition-transform hover:scale-105">
          <div className="bg-emerald-100 dark:bg-emerald-950/60 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Smart Civic AI</span>
        </Link>
      </div>

      {/* User info card in sidebar */}
      {user && (
        <div className="mx-4 mb-2 rounded-2xl bg-white dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
            {user.name}
          </p>
          <p className="text-xs text-slate-500 truncate mb-3">{user.email}</p>
          <Badge
            variant="outline"
            className={`text-xs capitalize font-medium px-2 py-0.5 rounded-full ${roleBadgeColor[user.role] || ""}`}
          >
            <Shield className="h-3 w-3 mr-1.5" />
            {user.role}
          </Badge>
        </div>
      )}

      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href ||
                             (item.href === "/complaint/create" && (location.pathname === "/complaint/new" || location.pathname === "/create-complaint")) ||
                             (item.href === "/worker-queue" && (location.pathname === "/worker-dashboard" || location.pathname === "/worker/dashboard")) ||
                             (item.href === "/officer-portal" && (location.pathname === "/officer" || location.pathname === "/officer-dashboard" || location.pathname === "/officer/dashboard")) ||
                             (item.href === "/admin" && (location.pathname === "/admin-dashboard" || location.pathname === "/admin/dashboard"))
            const isCitizen = user?.role === "citizen"
            const isAdmin = user?.role === "admin"
            const isOfficerOrAdmin = ["admin", "officer"].includes(user?.role ?? "")
            const isWorkerOfficerAdmin = ["admin", "officer", "worker"].includes(user?.role ?? "")

            if (item.citizenOnly && !isCitizen) return null
            if (item.adminOnly && !isAdmin) return null
            if (item.officerOnly && !isOfficerOrAdmin) return null
            if (item.workerOnly && !isWorkerOfficerAdmin) return null
            return (
              <Link
                key={item.key}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-semibold" 
                    : "text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className={`h-5 w-5 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-600"}`} />
                {t(item.key, item.defaultName)}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 rounded-xl h-11 border-red-100 text-red-600 hover:text-red-700 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 transition-all"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {t("nav.logout", "Logout")}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Permanent Fixed Sidebar */}
      <div className="hidden md:block shrink-0 w-[260px] lg:w-[280px] h-full border-r border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden min-w-0">
        {/* Permanent Fixed Top Header */}
        <header className="shrink-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-4 lg:px-8 shadow-sm">
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

          <div className="w-full flex-1">
            <form>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  type="search"
                  placeholder="Search complaints..."
                  className="w-full appearance-none bg-slate-100/50 dark:bg-slate-800/50 border-transparent focus:border-primary focus:bg-white dark:focus:bg-slate-900 pl-10 h-10 rounded-full shadow-none transition-all md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>

          <LanguageSelector />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
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
        </header>

        {/* Independently Scrollable Main Content Container */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
