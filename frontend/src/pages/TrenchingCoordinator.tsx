import { useState, useEffect, useCallback } from "react"
import {
  Building2,
  RefreshCw,
  Zap,
  Plus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { advancedMunicipalApi, type TrenchingPermit } from "@/services/advancedMunicipalApi"
import { formatCurrencyINR } from "@/utils/formatters"
import toast from "react-hot-toast"

export default function TrenchingCoordinator() {
  const [permits, setPermits] = useState<TrenchingPermit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState("all")

  // Form State
  const [agencyName, setAgencyName] = useState("Adani Electricity Mumbai Ltd (AEML)")
  const [roadName, setRoadName] = useState("Linking Road (Bandra)")
  const [ward, setWard] = useState("Ward H-West")
  const [purpose, setPurpose] = useState("11kV Feeder Cable Trenching")
  const [lengthMeters, setLengthMeters] = useState(250)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchPermits = useCallback(async () => {
    try {
      setLoading(true)
      const res = await advancedMunicipalApi.getTrenchingPermits(selectedWard)
      setPermits(res.permits)
    } catch {
      toast.error("Failed to load trenching permits")
    } finally {
      setLoading(false)
    }
  }, [selectedWard])

  useEffect(() => {
    fetchPermits()
  }, [fetchPermits])

  const handleSubmitPermit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await advancedMunicipalApi.requestTrenchingPermit({
        agencyName,
        roadName,
        ward,
        purpose,
        estimatedLengthMeters: Number(lengthMeters),
      })
      if (res.evaluation.isDlpBlocked) {
        toast.error(res.evaluation.reason, { duration: 6000 })
      } else if (res.evaluation.isCollisionDetected) {
        toast.success(res.evaluation.message, { icon: "🔄", duration: 6000 })
      } else {
        toast.success(res.evaluation.message, { duration: 5000 })
      }
      fetchPermits()
    } catch {
      toast.error("Trenching submission failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4 sm:px-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Inter-Agency Trenching & Road Digging
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              UTILITY COLLISION RADAR
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Spatial-temporal trenching coordination preventing repetitive digging on freshly laid roads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium"
          >
            <option value="all">All Mumbai Wards</option>
            <option value="Ward H-West">Ward H-West (Bandra)</option>
            <option value="Ward G-North">Ward G-North (Dadar)</option>
            <option value="Ward K-West">Ward K-West (Andheri)</option>
          </select>
          <Button
            onClick={fetchPermits}
            variant="outline"
            size="sm"
            className="border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5 rounded-xl h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Top 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Joint Trenching Savings
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            ₹3.58 Lakhs
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Municipal road reinstatement funds preserved</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Active Dig Permits
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {permits.length} Utilities
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Adani, MGL, Tata Power, Airtel, Jio</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            DLP Road Protection Lock
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
            18 Protected Roads
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Zero unauthorized cutting under 36M warranty</p>
        </div>
      </div>

      {/* Permit Submission & Collision Engine Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-sm font-bold font-display text-slate-900 dark:text-white">
                Submit Utility Corridor Permit
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              AUTO COLLISION TEST
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSubmitPermit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Utility Agency
                </label>
                <select
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="Adani Electricity Mumbai Ltd (AEML)">Adani Electricity (AEML)</option>
                  <option value="Mahanagar Gas Ltd (MGL)">Mahanagar Gas (MGL)</option>
                  <option value="Tata Power Company">Tata Power Company</option>
                  <option value="Airtel Telesonic Optical Fiber">Airtel Optical Fiber</option>
                  <option value="Jio Digital Fiber Pvt Ltd">Jio Digital Fiber</option>
                  <option value="BMC Hydraulic Engineering Department">BMC Water (Hydraulic Dept)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Ward
                  </label>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="Ward H-West">Ward H-West</option>
                    <option value="Ward G-North">Ward G-North</option>
                    <option value="Ward K-West">Ward K-West</option>
                    <option value="Ward F-North">Ward F-North</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Length (Meters)
                  </label>
                  <input
                    type="number"
                    value={lengthMeters}
                    onChange={(e) => setLengthMeters(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Target Road Corridor
                </label>
                <input
                  type="text"
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Purpose / Utility Type
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold py-2 shadow-sm gap-1.5 transition-all mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Auditing Corridor Collisions..." : "Submit for Dig-Once Evaluation"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Permits Corridor List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              Active Municipal Trenching Corridors
            </h2>
            <span className="text-xs font-mono text-slate-400">90-Day Dig Windows</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {permits.map((p) => {
              const isMerged = p.status === "JOINT_TRENCHING_MERGED"
              const isDlpBlocked = p.status === "DLP_BLOCKED"

              return (
                <div key={p.permitId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{p.permitId}</span>
                      <Badge
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          isMerged
                            ? "bg-indigo-600 text-white"
                            : isDlpBlocked
                            ? "bg-rose-600 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {p.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                      {p.roadName} ({p.estimatedLengthMeters}m)
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      Agency: <strong>{p.agencyName}</strong> • {p.purpose}
                    </p>
                    {isMerged && (
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
                        🔄 Joint Trenching with {p.coordinatingAgencies?.join(" & ")} • Savings: {formatCurrencyINR(p.sharedCostSavingsInr || 0)}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono block">Reinstatement Bond</span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrencyINR(p.reinstatementBondAmountInr)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
