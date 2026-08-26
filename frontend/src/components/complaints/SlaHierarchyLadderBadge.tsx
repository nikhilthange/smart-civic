import { Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SlaHierarchyLadderBadgeProps {
  elapsedHours?: number
  currentTier?: number // 1 to 4
}

const TIERS = [
  { level: 1, code: "JE", title: "Junior Engineer", hours: "0-24h", color: "bg-emerald-600 text-white" },
  { level: 2, code: "EE", title: "Executive Engineer", hours: "24-48h", color: "bg-amber-600 text-white" },
  { level: 3, code: "AMC", title: "Ward AMC", hours: "48-72h", color: "bg-orange-600 text-white" },
  { level: 4, code: "MC", title: "BMC HQ / Comm.", hours: ">72h", color: "bg-rose-600 text-white" },
]

export function SlaHierarchyLadderBadge({
  elapsedHours = 32,
  currentTier = 2,
}: SlaHierarchyLadderBadgeProps) {
  // Determine tier based on elapsed hours if not passed
  let activeLevel = currentTier
  if (elapsedHours < 24) activeLevel = 1
  else if (elapsedHours < 48) activeLevel = 2
  else if (elapsedHours < 72) activeLevel = 3
  else activeLevel = 4

  const activeTierObj = TIERS[activeLevel - 1]

  return (
    <div className="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-sm space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold flex items-center gap-1.5 text-slate-200">
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Statutory Escalation Ladder</span>
        </span>
        <Badge className={`${activeTierObj.color} font-mono text-[10px] font-bold px-2 py-0`}>
          TIER {activeLevel}: {activeTierObj.title}
        </Badge>
      </div>

      {/* 4-Tier Step Visualization */}
      <div className="grid grid-cols-4 gap-1.5">
        {TIERS.map((tier) => {
          const isActive = tier.level === activeLevel
          const isPassed = tier.level < activeLevel

          return (
            <div
              key={tier.code}
              className={`p-2 rounded-xl border text-center transition-all ${
                isActive
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400"
                  : isPassed
                  ? "bg-slate-800/80 border-slate-700 text-slate-400"
                  : "bg-slate-950/40 border-slate-800 text-slate-600"
              }`}
            >
              <div className="text-[11px] font-mono font-black">{tier.code}</div>
              <div className="text-[9px] text-slate-400 font-sans mt-0.5 truncate">{tier.hours}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
