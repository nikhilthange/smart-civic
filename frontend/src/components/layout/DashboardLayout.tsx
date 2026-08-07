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
import { NotificationBell } from "@/components/ui/NotificationBell"

const navItems = [
  { name: "Dashboard",         href: "/dashboard",          icon: LayoutDashboard },
  { name: "Create Complaint",  href: "/complaint/new",      icon: FileEdit },
  { name: "Complaint History", href: "/complaints",          icon: History },
  { name: "Search",            href: "/search",              icon: Search },
  { name: "Donations",         href: "/donate",              icon: HeartHandshake },
  { name: "Admin Dashboard",   href: "/admin/dashboard",     icon: BarChart3,  adminOnly: true },
  { name: "Analytics",         href: "/admin/analytics",     icon: LineChart,  adminOnly: true },
]

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()

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
    citizen: "bg-green-100 text-green-700 border-green-200",
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col gap-4 py-4">
      <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6 mb-2">
        <Link to="/" className="flex items-center gap-3 font-semibold transition-transform hover:scale-105">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl tracking-tight">Smart Civic AI</span>
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
            const isActive = location.pathname === item.href
            const isAdmin = ["admin", "officer"].includes(user?.role ?? "")
            if (item.adminOnly && !isAdmin) return null
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold" 
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className={`h-5 w-5 transition-colors ${isActive ? "text-primary-foreground" : "text-slate-400 group-hover:text-primary"}`} />
                {item.name}
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
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <div className="grid min-h-[100svh] w-full md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr] bg-slate-50 dark:bg-slate-950">
      <div className="hidden border-r border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl md:block">
        <Sidebar />
      </div>
      <div className="flex flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-4 lg:px-8 shadow-sm">
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
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
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

        <main className="flex flex-1 flex-col gap-6 p-4 lg:p-8 bg-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
