import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Compass,
  Home as HomeIcon,
  Search,
  MapPin,
  PlusCircle,
  FileSearch,
  LifeBuoy,
  PhoneCall
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SmartCivicLogo from "@/components/common/SmartCivicLogo"

export default function NotFound() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const QUICK_LINKS = [
    {
      title: "File a Grievance",
      desc: "Report potholes, garbage, water leaks to BMC",
      href: "/complaint/create",
      icon: PlusCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60"
    },
    {
      title: "Track Grievance",
      desc: "Look up your 48h SLA resolution status",
      href: "/track",
      icon: FileSearch,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60"
    },
    {
      title: "24-Ward GIS Map",
      desc: "Live geospatial defect & flood clusters",
      href: "/map",
      icon: MapPin,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60"
    },
    {
      title: "Help & Citizen Support",
      desc: "Contact civic helpline & ward officers",
      href: "/support",
      icon: LifeBuoy,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/60"
    }
  ]

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <SmartCivicLogo className="w-8 h-8" />
            <span className="font-bold text-lg tracking-tight">Smart Civic <span className="text-emerald-600">AI</span></span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="text-xs sm:text-sm flex items-center gap-1.5">
              <HomeIcon className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-2xl w-full text-center space-y-8 my-auto">
          {/* Animated 404 Radar Graphic */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative inline-flex items-center justify-center"
          >
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border border-dashed border-emerald-500/40 animate-spin" style={{ animationDuration: "20s" }}></div>
              <Compass className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            </div>
            <span className="absolute -bottom-3 px-3 py-1 text-xs font-mono font-bold uppercase tracking-widest rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md">
              404 • Route Not Found
            </span>
          </motion.div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Oops! This Civic Ward Coordinate Doesn't Exist
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
              The municipal page or ticket route you are looking for has been relocated, resolved, or never existed in the Greater Mumbai index.
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search complaints, wards, or tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-emerald-500"
              />
            </div>
            <Button type="submit" className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm">
              Search
            </Button>
          </form>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
            {QUICK_LINKS.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`p-4 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-md ${item.bg}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 shadow-xs shrink-0 ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Emergency / BMC Support Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/60 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            <span>BMC Disaster Management Helpline: <strong>1916</strong> (Toll-Free 24x7)</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        © 2026 Smart Civic AI Platform • Greater Mumbai 24-Ward Municipal Intelligence
      </footer>
    </div>
  )
}
