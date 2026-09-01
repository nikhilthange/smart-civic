import { Link } from "react-router-dom"
import { Building2, Search, Command } from "lucide-react"
import { NotificationBell } from "@/components/ui/NotificationBell"

export default function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#090A0F]/70 backdrop-blur-xl px-4 lg:px-8 shadow-sm">
      <Link to="/" className="flex items-center gap-2.5 font-semibold text-zinc-900 dark:text-zinc-100 transition-opacity hover:opacity-80">
        <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-1.5 rounded-lg shadow-sm">
          <Building2 className="h-4 w-4" />
        </div>
        <span className="tracking-tight text-sm font-bold">Smart Civic</span>
      </Link>

      <div className="flex-1 max-w-md mx-auto hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="search"
            placeholder="Search municipal tickets... (⌘K)"
            className="w-full bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 pl-8.5 pr-8 h-8 text-xs rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/30"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2.5 ml-auto">
        <NotificationBell />
      </div>
    </header>
  )
}
