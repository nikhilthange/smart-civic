import { useState, useEffect, useCallback } from "react"
import {
  Waves,
  ShieldAlert,
  Building2,
  RefreshCw,
  Send,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { advancedMunicipalApi, type SubwayStatus } from "@/services/advancedMunicipalApi"
import toast from "react-hot-toast"

export default function DisasterSubways() {
  const [subways, setSubways] = useState<SubwayStatus[]>([])
  const [loading, setLoading] = useState(true)

  // Simulation state
  const [selectedSubway, setSelectedSubway] = useState("SUB-ANDHERI")
  const [simDepth, setSimDepth] = useState(38)
  const [simResult, setSimResult] = useState<any>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const fetchSubways = useCallback(async () => {
    try {
      setLoading(true)
      const res = await advancedMunicipalApi.getSubways()
      setSubways(res.subways)
    } catch {
      toast.error("Failed to load subway underpass telemetry")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubways()
  }, [fetchSubways])

  const handleSimulateDepth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSimulating(true)
    try {
      const res = await advancedMunicipalApi.ingestSubwayTelemetry({
        subwayId: selectedSubway,
        waterDepthCm: simDepth,
      })
      setSimResult(res)
      if (res.isClosed) {
        toast.error(res.statusMessage, { icon: "⛔", duration: 7000 })
      } else {
        toast.success(res.statusMessage, { duration: 5000 })
      }
      fetchSubways()
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
              Disaster Subway & Water-Gate Watch
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              ULTRASONIC SENSORS ACTIVE
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Autonomous barrier deployment and dynamic BEST transit re-routing when water depth exceeds 25cm.
          </p>
        </div>

        <Button
          onClick={fetchSubways}
          variant="outline"
          size="sm"
          className="border-zinc-200 dark:border-zinc-800 text-xs font-medium gap-1.5 rounded-md h-9"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Telemetry</span>
        </Button>
      </div>

      {/* Subway Telemetry Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Critical Depth Trigger
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            30 cm
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Automated barrier closure threshold</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Submerged Underpasses
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
            {subways.filter((s) => s.trafficStatus === "SUBMERGED_CLOSED").length} Closed
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Traffic diverted to grade-separated flyovers</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Active Dewatering Pumps
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            22 Pumps Active
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Andheri, Milan, Malad, Khar, Dahisar</p>
        </div>
      </div>

      {/* Simulator & Live Subway Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Depth Simulator */}
        <Card className="lg:col-span-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-rose-600" />
              <CardTitle className="text-sm font-bold font-display text-slate-900 dark:text-white">
                Simulate Subway Water Level
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              ULTRASONIC SENSOR
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSimulateDepth} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Target Subway Underpass
                </label>
                <select
                  value={selectedSubway}
                  onChange={(e) => setSelectedSubway(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="SUB-ANDHERI">Andheri East-West Subway (Ward K-West)</option>
                  <option value="SUB-MILAN">Milan Subway Santacruz (Ward H-West)</option>
                  <option value="SUB-MALAD">Malad Subway (Ward P-North)</option>
                  <option value="SUB-KHAR">Khar Subway (Ward H-East)</option>
                  <option value="SUB-DAHISAR">Dahisar Subway (Ward R-North)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold">
                    Water Level Depth (cm)
                  </label>
                  <span className={`font-mono font-bold ${simDepth >= 30 ? "text-rose-600" : "text-emerald-600"}`}>
                    {simDepth} cm
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={simDepth}
                  onChange={(e) => setSimDepth(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                disabled={isSimulating}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold py-2 shadow-sm gap-1.5 transition-all mt-2"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isSimulating ? "Processing Sensor Stream..." : "Inject Depth & Compute Detour"}</span>
              </Button>
            </form>

            {simResult?.broadcastAlert && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold">
                  <Send className="w-3.5 h-3.5" />
                  <span>Citizen 1.5km SMS / WhatsApp Alert Broadcast</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-rose-100 dark:border-rose-900">
                  {simResult.broadcastAlert.smsText}
                </p>
                <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                  <span>Bypass Flyover: <strong>{simResult.broadcastAlert.alternateFlyover}</strong></span>
                  <span>Target Radius: 1.5 km</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Subways Underpass List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-rose-600" />
              Mumbai Underpasses Live Inundation Status
            </h2>
            <span className="text-xs font-mono text-slate-400">Ultrasonic Telemetry</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {subways.map((s) => {
              const isClosed = s.trafficStatus === "SUBMERGED_CLOSED"
              const isRestricted = s.trafficStatus === "RESTRICTED_SINGLE_LANE"

              return (
                <div key={s.subwayId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{s.subwayId}</span>
                      <Badge
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          isClosed
                            ? "bg-rose-600 text-white animate-pulse"
                            : isRestricted
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {s.trafficStatus.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                      {s.subwayName}
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      {s.ward} • Emergency Detour: <strong>{s.alternateFlyoverName}</strong> • {s.activePumpsCount} Pumps
                    </p>
                  </div>

                  <div className="text-right shrink-0 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-mono block">Water Depth</span>
                    <span className={`text-base font-mono font-bold ${s.waterDepthCm >= 30 ? "text-rose-600" : "text-emerald-600"}`}>
                      {s.waterDepthCm} cm
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">Barrier @ 30cm</span>
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
