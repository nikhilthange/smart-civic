import { Link } from "react-router-dom"
import { Building2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import LanguageSelector from "@/components/common/LanguageSelector"
import { NotificationBell } from "@/components/ui/NotificationBell"

export default function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-4 lg:px-8 shadow-sm">
      <Link to="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
        <Building2 className="h-5 w-5 text-indigo-600" />
        <span>Smart Civic Portal</span>
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
