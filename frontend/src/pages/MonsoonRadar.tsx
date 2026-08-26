import { useState, useEffect, useCallback } from "react"
import {
  Waves,
  CloudRain,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Gauge,
  Activity,
  Droplets,
  Building2,
  Sliders,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { municipalApi, type FloodRadarResponse } from "@/services/municipalApi"
import toast from "react-hot-toast"

export default function MonsoonRadar() {
  const [data, setData] = useState<FloodRadarResponse | null>(null)
  const [rainfallMm, setRainfallMm] = useState<number>(45)
  const [loading, setLoading] = useState(true)

  // Desilting form state
  const [isVerifying, setIsVerifying] = useState(false)
  const [nullahName, setNullahName] = useState("Love Grove Major Nullah")
  const [ward, setWard] = useState("Ward G-South")
  const [extractedTonnage, setExtractedTonnage] = useState(1250)

  const fetchRadar = useCallback(async () => {
    try {
      setLoading(true)
      const res = await municipalApi.getFloodRadar(rainfallMm)
      setData(res)
    } catch {
      toast.error("Failed to load live flood radar telemetry")
    } finally {
      setLoading(false)
    }
  }, [rainfallMm])

  useEffect(() => {
    fetchRadar()
  }, [fetchRadar])

  const handleVerifyDesilting = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    try {
      const res = await municipalApi.verifyDesilting({
        nullahId: `NUL-${ward.replace(/\s+/g, "").toUpperCase()}-01`,
        nullahName,
        ward,
        targetSiltTonnage: 1200,
        extractedSiltTonnage: extractedTonnage,
        preDesiltingBedDepthMeters: 1.2,
      })
      toast.success(res.message, { duration: 6000 })
    } catch {
      toast.error("Failed to verify desilting proof")
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-2 pb-12 px-2 sm:px-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Monsoon Flood Radar
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Real-time flood risk indexing across 5 chronic Mumbai spots, Arabian Sea tide schedules, and SWD pumping stations.
          </p>
        </div>

        <Button
          onClick={fetchRadar}
          variant="outline"
          size="sm"
          className="border-zinc-200 dark:border-zinc-800 text-xs font-medium gap-1.5 rounded-md h-9"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Radar</span>
        </Button>
      </div>

      {/* Top 4 Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Rainfall Intensity */}
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Rain Gauge (IMD)
            </span>
            <CloudRain className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono tabular-nums">
            {rainfallMm} mm/hr
          </div>
          <p className="text-xs text-zinc-400">Heavy precipitation band</p>
        </div>

        {/* Arabian Sea Tide */}
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Arabian Sea Tide
            </span>
            <Waves className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono tabular-nums">
            {data?.telemetry.tide.tideHeightMeters ?? 4.2}m
          </div>
          <p className="text-xs text-zinc-400 font-mono tabular-nums">
            High Tide: {data?.telemetry.tide.nextHighTide || "14:45 IST"}
          </p>
        </div>

        {/* Active Flood Hotspots */}
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Flood Inundations
            </span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-semibold tracking-tight text-red-600 dark:text-red-400 font-mono tabular-nums">
            {data?.telemetry.activeFloodHotspots ?? 2} Critical
          </div>
          <p className="text-xs text-zinc-400">Subways under water-gate watch</p>
        </div>

        {/* Total Pumping Discharge */}
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              SWD Discharge
            </span>
            <Droplets className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {data?.telemetry.totalActivePumpingCapacityCubicMPerSec ?? 248} m³/s
          </div>
          <p className="text-xs text-zinc-400">7 Coastal pumping stations</p>
        </div>
      </div>

      {/* Interactive Rain Simulator Slider */}
      <Card className="border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-xs font-bold font-mono uppercase text-slate-700 dark:text-slate-300">
                Simulate Cloudburst Rainfall Intensity
              </span>
              <p className="text-[11px] text-slate-400">Adjust rainfall load to stress-test municipal subway sluices and flood basins</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={rainfallMm}
              onChange={(e) => setRainfallMm(Number(e.target.value))}
              className="w-44 accent-emerald-600 cursor-pointer"
            />
            <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              {rainfallMm} mm/hr
            </span>
          </div>
        </div>
      </Card>

      {/* Chronic Waterlogging Hotspots Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-600" />
            Chronic Mumbai Flood Inundation Hotspots
          </h2>
          <span className="text-xs font-mono text-slate-400">Continuous Sluice Watch</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.hotspots.map((spot) => {
            const isRed = spot.alertLevel === "RED_EMERGENCY"
            const isAmber = spot.alertLevel === "AMBER_WARNING"

            return (
              <div
                key={spot.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isRed
                    ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30"
                    : isAmber
                    ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/30"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/[0.08]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-500">{spot.id}</span>
                  <Badge
                    className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                      isRed
                        ? "bg-rose-600 text-white animate-pulse"
                        : isAmber
                        ? "bg-amber-500 text-white"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {isRed ? "RED FLOOD ALERT" : isAmber ? "AMBER WATCH" : "ALL CLEAR"}
                  </Badge>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                  {spot.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{spot.ward} • {spot.catchmentNullah}</p>

                <div className="mt-3.5 grid grid-cols-2 gap-2 bg-slate-50/80 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">Risk Index</span>
                    <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                      {spot.riskScore} / 100
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">Water Level</span>
                    <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                      {spot.inundationDepthCm} cm
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-3 font-sans leading-relaxed">
                  {spot.trafficAdvisory}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* SWD Pumping Stations + AI Nullah Desilting Verifier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SWD Pumping Stations */}
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            SWD Coastal Pumping Stations Telemetry
          </h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
            {data?.pumpingStations.map((pump) => (
              <div key={pump.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{pump.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Discharge: {pump.dischargeCapacityCubicMPerSec} m³/sec
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {pump.activePumps} / {pump.totalPumps} Active
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Nullah Desilting Proof Verifier */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            AI Nullah Desilting Depth Verifier
          </h2>
          <Card className="border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                Verify Canal Bed Silt Clearance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleVerifyDesilting} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Major Nullah Name
                  </label>
                  <input
                    type="text"
                    value={nullahName}
                    onChange={(e) => setNullahName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    required
                  />
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
                      <option value="Ward G-South">Ward G-South</option>
                      <option value="Ward F-North">Ward F-North</option>
                      <option value="Ward H-West">Ward H-West</option>
                      <option value="Ward K-West">Ward K-West</option>
                      <option value="Ward M-West">Ward M-West</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                      Silt Extracted (MT)
                    </label>
                    <input
                      type="number"
                      value={extractedTonnage}
                      onChange={(e) => setExtractedTonnage(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold py-2 shadow-sm gap-1.5 transition-all mt-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isVerifying ? "Verifying Bed Depth..." : "Run AI Bed Depth Verification"}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
