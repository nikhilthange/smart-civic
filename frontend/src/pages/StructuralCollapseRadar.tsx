import { useState, useEffect, useCallback } from "react"
import {
  Building2,
  ShieldAlert,
  RefreshCw,
  Sliders,
  Send,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cityOsApi, type DilapidatedBuilding } from "@/services/cityOsApi"
import toast from "react-hot-toast"

export default function StructuralCollapseRadar() {
  const [buildings, setBuildings] = useState<DilapidatedBuilding[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState("all")

  // Simulator state
  const [simBuildingId, setSimBuildingId] = useState("BLD-GN-01")
  const [simTilt, setSimTilt] = useState(2.8)
  const [simCrack, setSimCrack] = useState(14.5)
  const [simResult, setSimResult] = useState<any>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const fetchBuildings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await cityOsApi.getDilapidatedBuildings(selectedWard)
      setBuildings(res.buildings)
    } catch {
      toast.error("Failed to load dilapidated buildings radar")
    } finally {
      setLoading(false)
    }
  }, [selectedWard])

  useEffect(() => {
    fetchBuildings()
  }, [fetchBuildings])

  const handleSimulateTelemetry = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSimulating(true)
    try {
      const res = await cityOsApi.ingestStructuralTelemetry({
        buildingId: simBuildingId,
        tiltAngleDegrees: simTilt,
        crackDisplacementMm: simCrack,
      })
      setSimResult(res)
      if (res.isImminentHazard) {
        toast.error(res.statusMessage, { icon: "🚨", duration: 7000 })
      } else {
        toast.success(res.statusMessage, { duration: 5000 })
      }
      fetchBuildings()
    } catch {
      toast.error("Telemetry simulation failed")
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Structural Health & C-1 Dilapidated Buildings
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              MMC ACT SECTION 354
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            IoT tiltmeter, crack displacement sensors, and automated evacuation notice dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-2 rounded-md bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs font-medium"
          >
            <option value="all">All Mumbai Wards</option>
            <option value="Ward G-North">Ward G-North (Dadar)</option>
            <option value="Ward H-West">Ward H-West (Bandra)</option>
            <option value="Ward K-West">Ward K-West (Andheri)</option>
          </select>

          <Button
            onClick={fetchBuildings}
            variant="outline"
            size="sm"
            className="border-zinc-200 dark:border-zinc-800 text-xs font-medium gap-1.5 rounded-md h-9"
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
            Collapse Threshold Trigger
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            Tilt &ge; 2.5° • Crack &gt; 12mm
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Automated evacuation trigger parameters</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Imminent Collapse Hazards
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
            {buildings.filter((b) => b.status === "IMMINENT_COLLAPSE_HAZARD").length} Structures
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Disaster cell & ward police alerted</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Transit Camp Passes Issued
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            32 Families
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Sion-Koliwada Transit Sector C</p>
        </div>
      </div>

      {/* Sensor Ingestion Simulator & Live Buildings Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sensor Simulator */}
        <Card className="lg:col-span-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-600" />
              <CardTitle className="text-sm font-bold font-display text-slate-900 dark:text-white">
                Simulate Building Tilt & Crack Gauge
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              MICRO-TILTMETER
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSimulateTelemetry} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Target Dilapidated Structure
                </label>
                <select
                  value={simBuildingId}
                  onChange={(e) => setSimBuildingId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="BLD-GN-01">Siddharth Chawl (C1 - Dadar West)</option>
                  <option value="BLD-HW-02">Bandra Bazar Quarters (C2A - Bandra West)</option>
                  <option value="BLD-KW-03">Juhu Gulmohar CHS (C1 - Andheri West)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold">
                    Tilt Angle (Degrees)
                  </label>
                  <span className={`font-mono font-bold ${simTilt >= 2.5 ? "text-rose-600" : "text-emerald-600"}`}>
                    {simTilt}° (Threshold &ge; 2.5°)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="4.5"
                  step="0.1"
                  value={simTilt}
                  onChange={(e) => setSimTilt(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold">
                    Crack Gauge Displacement (mm)
                  </label>
                  <span className={`font-mono font-bold ${simCrack > 12 ? "text-rose-600" : "text-emerald-600"}`}>
                    {simCrack} mm (Threshold &gt; 12mm)
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="25"
                  step="0.5"
                  value={simCrack}
                  onChange={(e) => setSimCrack(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                disabled={isSimulating}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold py-2 shadow-sm gap-1.5 transition-all mt-2"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isSimulating ? "Processing Telemetry..." : "Inject Telemetry & Check Collapse Alert"}</span>
              </Button>
            </form>

            {simResult?.evacuationNotice && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold">
                  <Send className="w-3.5 h-3.5" />
                  <span>Executive Evacuation & Transit Camp Allotment Active</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-rose-100 dark:border-rose-900">
                  {simResult.evacuationNotice.alertMessage}
                </p>
                <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                  <span>Transit Camp: <strong>{simResult.evacuationNotice.allocatedTransitCamp}</strong></span>
                  <span>Families: {simResult.evacuationNotice.affectedFamilies}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Buildings List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-rose-600" />
              Monitored C1 & C2A Dilapidated Structures
            </h2>
            <span className="text-xs font-mono text-slate-400">Micro-Sensor Telemetry</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {buildings.map((b) => {
              const isHazard = b.status === "IMMINENT_COLLAPSE_HAZARD"
              const isElevated = b.status === "ELEVATED_VIBRATION"

              return (
                <div key={b.buildingId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{b.buildingId}</span>
                      <Badge
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          isHazard
                            ? "bg-rose-600 text-white animate-pulse"
                            : isElevated
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {b.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                      {b.buildingName} ({b.structuralCategory})
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      {b.ward} • {b.address} • <strong>{b.residentFamilyCount} Families</strong>
                    </p>
                    {b.transitCampAllocated && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                        ⛺ Transit Camp Allotted: {b.transitCampLocation}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-mono block">Tilt Angle</span>
                    <span className={`text-base font-mono font-bold ${b.tiltAngleDegrees >= 2.5 ? "text-rose-600" : "text-slate-800 dark:text-slate-200"}`}>
                      {b.tiltAngleDegrees}°
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">Crack: {b.crackDisplacementMm}mm</span>
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
