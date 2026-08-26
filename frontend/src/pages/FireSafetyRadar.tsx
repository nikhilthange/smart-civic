import { useState, useEffect, useCallback } from "react"
import {
  Flame,
  ShieldAlert,
  Building2,
  RefreshCw,
  Sliders,
  Send,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cityOsApi, type HighRiseFireNoc } from "@/services/cityOsApi"
import toast from "react-hot-toast"

export default function FireSafetyRadar() {
  const [buildings, setBuildings] = useState<HighRiseFireNoc[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState("all")

  // Simulator State
  const [simBuildingId, setSimBuildingId] = useState("FIRE-HW-01")
  const [simPressure, setSimPressure] = useState(2.1)
  const [simDuration, setSimDuration] = useState(45)
  const [simResult, setSimResult] = useState<any>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const fetchBuildings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await cityOsApi.getFireSafetyBuildings(selectedWard)
      setBuildings(res.buildings)
    } catch {
      toast.error("Failed to load fire safety NOC radar")
    } finally {
      setLoading(false)
    }
  }, [selectedWard])

  useEffect(() => {
    fetchBuildings()
  }, [fetchBuildings])

  const handleSimulatePressure = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSimulating(true)
    try {
      const res = await cityOsApi.ingestFireTelemetry({
        buildingId: simBuildingId,
        wetRiserPressureKgCm2: simPressure,
        pressureLossDurationMinutes: simDuration,
      })
      setSimResult(res)
      if (res.isCriticalLoss) {
        toast.error(res.statusMessage, { icon: "🚨", duration: 7000 })
      } else {
        toast.success(res.statusMessage, { duration: 5000 })
      }
      fetchBuildings()
    } catch {
      toast.error("Fire telemetry simulation failed")
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-2 pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Flame className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
              High-Rise Fire Safety Wet-Riser & NOC Refuge Radar
            </h1>
            <Badge className="bg-orange-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full">
              MFB COMMAND INTEGRATION
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Real-time booster pump pressure telemetry and automated Property Tax non-compliance citations for depressurized risers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold"
          >
            <option value="all">All Mumbai Wards</option>
            <option value="Ward H-West">Ward H-West (Bandra)</option>
            <option value="Ward G-North">Ward G-North (Dadar)</option>
            <option value="Ward K-West">Ward K-West (Andheri)</option>
          </select>
          <Button
            onClick={fetchBuildings}
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
            Minimum Riser Pressure
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            3.5 kg/cm²
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Statutory continuous booster pressure</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            MFB Radar Flagged Towers
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
            {buildings.filter((b) => b.mfbRadarFlagged).length} High-Rises
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Dry riser failure or refuge area blocked</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Property Tax Citations
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
            ₹75,000 Total
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Automated penalty debited via SAC ID</p>
        </div>
      </div>

      {/* Simulator & Live High-Rise Towers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pressure Simulator */}
        <Card className="lg:col-span-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-600" />
              <CardTitle className="text-sm font-bold font-display text-slate-900 dark:text-white">
                Simulate Wet-Riser Pressure Stream
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
              PRESSURE SENSOR
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSimulatePressure} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Target High-Rise Complex
                </label>
                <select
                  value={simBuildingId}
                  onChange={(e) => setSimBuildingId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="FIRE-HW-01">Bandra Imperial Sky Heights (42 Floors)</option>
                  <option value="FIRE-GN-02">Kohinoor Square Commercial (52 Floors)</option>
                  <option value="FIRE-KW-03">Lokhandwala Heights Residency (34 Floors)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold">
                    Booster Pump Riser Pressure (kg/cm²)
                  </label>
                  <span className={`font-mono font-bold ${simPressure < 3.5 ? "text-rose-600" : "text-emerald-600"}`}>
                    {simPressure} kg/cm² (Min: 3.5)
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="6.5"
                  step="0.1"
                  value={simPressure}
                  onChange={(e) => setSimPressure(Number(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold">
                    Depressurization Duration (Minutes)
                  </label>
                  <span className="font-mono font-bold text-amber-600">{simDuration} mins</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="5"
                  value={simDuration}
                  onChange={(e) => setSimDuration(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                disabled={isSimulating}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold py-2 shadow-sm gap-1.5 transition-all mt-2"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isSimulating ? "Analyzing Booster Telemetry..." : "Inject Telemetry & Check MFB Alert"}</span>
              </Button>
            </form>

            {simResult?.mfbDispatchNotice && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold">
                  <Send className="w-3.5 h-3.5" />
                  <span>MFB Emergency Citation & Property Tax Penalty</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-rose-100 dark:border-rose-900">
                  {simResult.mfbDispatchNotice.taxNotice}
                </p>
                <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                  <span>Penalty: ₹{simResult.mfbDispatchNotice.citationPenaltyInr?.toLocaleString()}</span>
                  <span>MFB Station: Byculla HQ</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: High-Rise List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-600" />
              High-Rise Fire NOC & Wet-Riser Status
            </h2>
            <span className="text-xs font-mono text-slate-400">Live Booster Sensors</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {buildings.map((b) => {
              const isCritical = b.status === "DRY_RISER_FAILURE_CRITICAL" || b.status === "REFUGE_BLOCKED_VIOLATION"
              return (
                <div key={b.buildingId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{b.buildingId}</span>
                      <Badge
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          isCritical
                            ? "bg-rose-600 text-white animate-pulse"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {b.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                      {b.buildingName}
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      {b.ward} • {b.floorCount} Floors • SAC: <strong>{b.propertyTaxSacId}</strong>
                    </p>
                    <div className="flex items-center gap-3 pt-0.5 text-[11px] text-slate-500">
                      <span>Sprinklers: <strong>{b.sprinklerSystemActive ? "✅ Active" : "❌ Inactive"}</strong></span>
                      <span>Refuge Clearance: <strong>{b.refugeFloorEncroached ? "🚨 Blocked" : "✅ Clear"}</strong></span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-mono block">Riser Pressure</span>
                    <span className={`text-base font-mono font-bold ${b.wetRiserPressureKgCm2 < 3.5 ? "text-rose-600" : "text-emerald-600"}`}>
                      {b.wetRiserPressureKgCm2} kg/cm²
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">Min 3.5 kg/cm²</span>
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
