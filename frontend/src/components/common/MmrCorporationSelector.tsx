import { Building2 } from "lucide-react"
import { MMR_CORPORATIONS, type MmrCorporation } from "@/data/nagarsevakDirectory"

interface MmrCorporationSelectorProps {
  selectedCorp: MmrCorporation
  onSelectCorp: (corp: MmrCorporation) => void
  className?: string
}

export default function MmrCorporationSelector({
  selectedCorp,
  onSelectCorp,
  className = "",
}: MmrCorporationSelectorProps) {
  return (
    <div className={`w-full overflow-x-auto pb-1 scrollbar-none ${className}`}>
      <div className="flex items-center gap-2 min-w-max">
        {MMR_CORPORATIONS.map((corp) => {
          const isSelected = selectedCorp === corp.id
          return (
            <button
              key={corp.id}
              type="button"
              onClick={() => onSelectCorp(corp.id as MmrCorporation)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
                isSelected
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
              <span>{corp.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                {corp.badge}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
