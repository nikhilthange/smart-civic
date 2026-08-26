import { Link } from "react-router-dom"
import { Building2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import LanguageSelector from "@/components/common/LanguageSelector"
import { NotificationBell } from "@/components/ui/NotificationBell"

export default function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 lg:px-8 shadow-sm shadow-slate-950/[0.02]">
      <Link to="/" className="flex items-center gap-2.5 font-extrabold font-display text-slate-900 dark:text-white">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-1.5 rounded-lg shadow-sm shadow-emerald-500/30">
          <Building2 className="h-4 w-4" />
        </div>
        <span className="tracking-tight text-base">Smart Civic AI</span>
      </Link>

      <div className="flex-1 max-w-md mx-auto hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search civic tickets..."
            className="w-full bg-slate-100/60 border-transparent pl-9 h-9 text-xs rounded-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <LanguageSelector />
        <NotificationBell />
      </div>
    </header>
  )
}
