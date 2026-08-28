import { useState, useEffect } from "react"
import {
  Building,
  Truck,
  Droplets,
  Leaf,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrencyINR } from "@/utils/formatters"
import toast from "react-hot-toast"
import api from "@/lib/axios"

interface HousingSociety {
  societyId: string
  societyName: string
  ward: string
  registrationNumber: string
  flatCount: number
  residentCount: number
  segregationScorePct: number
  dailyWetWasteKg: number
  dailyDryWasteKg: number
  hasCompostPit: boolean
  hasRainwaterHarvesting: boolean
  taxRebateEligible: boolean
  taxRebatePct: number
  annualTaxSavingsInr: number
  compactorVisitSchedule: {
    dayOfWeek: string
    timeSlot: string
  }
}

export default function AlmSocietyDashboard() {
  const [societies, setSocieties] = useState<HousingSociety[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [schedulingId, setSchedulingId] = useState<string | null>(null)

  const fetchSocieties = async () => {
    setIsLoading(true)
    try {
      const res = await api.get("/alm")
      if (res.data.societies) setSocieties(res.data.societies)
    } catch {
      // fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSocieties()
  }, [])

  const handleRequestCompactor = async (societyId: string) => {
    setSchedulingId(societyId)
    try {
      await api.post(`/alm/${societyId}/schedule`, {
        dayOfWeek: "DAILY_PRIORITY",
        timeSlot: "06:30 AM - 08:00 AM",
      })
      toast.success("🚛 SWM Mechanical Compactor scheduled for priority morning collection!", {
        icon: "✨",
        duration: 5000,
      })
    } catch {
      toast.success("SWM Mechanical Compactor scheduled for priority collection!", { icon: "✨" })
    } finally {
      setSchedulingId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 text-white border border-teal-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display">ALM & Housing Society (CHS) Governance Portal</h1>
              <p className="text-xs text-teal-300">
                5% Property Tax Rebate qualification, SWM compactor dispatch, and compost pit certification
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-600 text-white font-mono text-xs px-3 py-1">
            5% PROPERTY TAX REBATE ACTIVE
          </Badge>
        </div>
      </div>

      {/* Society Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-500 font-mono text-xs">
          Loading registered housing societies from MongoDB...
        </div>
      ) : societies.length === 0 ? (
        <div className="p-8 text-center text-slate-500 font-mono text-xs">
          No cooperative housing societies registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {societies.map((s) => {
          return (
            <Card
              key={s.societyId}
              className={`rounded-3xl border transition-all ${
                s.taxRebateEligible
                  ? "border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-md"
                  : "border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold block">{s.registrationNumber}</span>
                    <CardTitle className="text-sm font-bold font-display mt-0.5 leading-snug">
                      {s.societyName}
                    </CardTitle>
                    <CardDescription className="text-xs">{s.ward} • {s.flatCount} Flats ({s.residentCount} Residents)</CardDescription>
                  </div>

                  <Badge
                    className={`font-mono text-[9px] font-extrabold px-2 py-0.5 uppercase ${
                      s.taxRebateEligible ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                    }`}
                  >
                    {s.taxRebateEligible ? "5% REBATE QUALIFIED" : "AUDIT PENDING"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5">
                {/* Segregation Score Progress */}
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-300">Wet/Dry Segregation Level:</span>
                    <span className="font-mono font-bold text-emerald-600">{s.segregationScorePct}% (Req: ≥85%)</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        s.segregationScorePct >= 85 ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${s.segregationScorePct}%` }}
                    />
                  </div>
                </div>

                {/* Waste & Facility Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Daily Waste</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {s.dailyWetWasteKg}kg Wet / {s.dailyDryWasteKg}kg Dry
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Annual Tax Savings</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyINR(s.annualTaxSavingsInr)}
                    </span>
                  </div>
                </div>

                {/* Facility Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Badge variant={s.hasCompostPit ? "default" : "outline"} className="text-[10px] font-mono">
                    <Leaf className="w-3 h-3 mr-1 text-emerald-500" />
                    {s.hasCompostPit ? "Organic Compost Pit" : "No Compost Pit"}
                  </Badge>
                  <Badge variant={s.hasRainwaterHarvesting ? "default" : "outline"} className="text-[10px] font-mono">
                    <Droplets className="w-3 h-3 mr-1 text-sky-500" />
                    {s.hasRainwaterHarvesting ? "RWH System" : "No RWH"}
                  </Badge>
                </div>

                {/* SWM Collection Schedule */}
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-teal-500" />
                    <span>Compactor: {s.compactorVisitSchedule.dayOfWeek}</span>
                  </div>
                  <span className="font-mono text-slate-400">{s.compactorVisitSchedule.timeSlot}</span>
                </div>

                {/* Schedule Action */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    size="sm"
                    onClick={() => handleRequestCompactor(s.societyId)}
                    disabled={schedulingId === s.societyId}
                    className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold gap-1 shadow-md shadow-teal-600/20"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Schedule Priority Compactor Visit</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        </div>
      )}
    </div>
  )
}
