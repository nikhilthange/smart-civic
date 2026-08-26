import { useState, useEffect, useCallback } from "react"
import {
  Wind,
  ShieldAlert,
  Building2,
  RefreshCw,
  Sliders,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { advancedMunicipalApi, type ConstructionSite } from "@/services/advancedMunicipalApi"
import toast from "react-hot-toast"

export default function AqiEnforcement() {
  const [sites, setSites] = useState<ConstructionSite[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState("all")

  // Live Simulator state
  const [simSiteId, setSimSiteId] = useState("SITE-HW-02")
  const [simPm10, setSimPm10] = useState(185)
  const [simMinutes, setSimMinutes] = useState(65)
  const [isSimulating, setIsSimulating] = useState(false)

  const fetchSites = useCallback(async () => {
    try {
      setLoading(true)
      const res = await advancedMunicipalApi.getConstructionSites(selectedWard)
      setSites(res.sites)
    } catch {
      toast.error("Failed to load construction site AQI data")
    } finally {
      setLoading(false)
    }
  }, [selectedWard])

  useEffect(() => {
    fetchSites()
  }, [fetchSites])

  const handleSimulateTelemetry = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSimulating(true)
    try {
      const res = await advancedMunicipalApi.ingestAqiTelemetry({
        siteId: simSiteId,
        pm10: simPm10,
        pm25: Math.round(simPm10 * 0.48),
        exceedanceDurationMinutes: simMinutes,
      })
      if (res.isStopWorkNoticeIssued) {
        toast.error(res.enforcementNotice, { icon: "⛔", duration: 7000 })
      } else {
        toast.success(res.enforcementNotice, { duration: 5000 })
      }
      fetchSites()
    } catch {
      toast.error("Telemetry ingestion failed")
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
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Wind className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
              C&D Dust & Air Quality (AQI) Barricade Enforcement
            </h1>
            <Badge className="bg-teal-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full">
              BMC CLEAN AIR RADAR
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Real-time PM10/PM2.5 micro-sensor telemetry, 35ft fabric barricade verification, and automated ₹50,000 stop-work penalties.
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
            <option value="Ward G-North">Ward G-North (Dadar / Lower Parel)</option>
            <option value="Ward K-West">Ward K-West (Andheri)</option>
          </select>
          <Button
            onClick={fetchSites}
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
            BMC Statutory PM10 Cap
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            150 µg/m³
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Continuous 60-minute exceedance threshold</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Active Stop-Work Notices
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
            {sites.filter((s) => s.stopWorkNoticeIssued).length} Construction Sites
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">₹50,000 environmental penalty debited</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            35ft Barricade Compliance
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            91.2%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Green fabric + Wheel wash basin verified</p>
        </div>
      </div>

      {/* Sensor Ingestion Simulator & Barricade Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              <CardTitle className="text-sm font-bold font-display text-slate-900 dark:text-white">
                Simulate Site PM10 Sensor Stream
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
              MICRO-SENSOR
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSimulateTelemetry} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Target Construction Project
                </label>
                <select
                  value={simSiteId}
                  onChange={(e) => setSimSiteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="SITE-HW-02">Rustomjee Seasons (Bandra Reclamation)</option>
                  <option value="SITE-GN-01">Lodha Supremus (Lower Parel / Dadar)</option>
                  <option value="SITE-KW-03">Oberoi Sky City (Andheri West)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold">
                    PM10 Concentration (µg/m³)
                  </label>
                  <span className="font-mono font-bold text-teal-600">{simPm10} µg/m³</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="350"
                  step="5"
                  value={simPm10}
                  onChange={(e) => setSimPm10(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold">
                    Exceedance Duration (Minutes)
                  </label>
                  <span className="font-mono font-bold text-amber-600">{simMinutes} mins</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={simMinutes}
                  onChange={(e) => setSimMinutes(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                disabled={isSimulating}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold py-2 shadow-sm gap-1.5 transition-all mt-2"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isSimulating ? "Processing Telemetry..." : "Evaluate AQI & Trigger Stop-Work"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active Sites List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              Active Construction Sites & Dust Mitigation Status
            </h2>
            <span className="text-xs font-mono text-slate-400">200m Buffer Watch</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {sites.map((s) => {
              const isStopWork = s.stopWorkNoticeIssued || s.status === "STOP_WORK_NOTICE_ACTIVE"
              return (
                <div key={s.siteId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{s.siteId}</span>
                      <Badge
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          isStopWork
                            ? "bg-rose-600 text-white animate-pulse"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {isStopWork ? "STOP WORK ACTIVE (₹50k FINE)" : "COMPLIANT"}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                      {s.projectName} ({s.developerName})
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {s.ward} • RERA: {s.reraPermitNo}
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                      <span>35ft Barricade: <strong>{s.has35FtBarricadeCompliance ? "✅ Yes" : "❌ Missing"}</strong></span>
                      <span>Wheel Wash: <strong>{s.hasWheelWashBasin ? "✅ Yes" : "❌ Missing"}</strong></span>
                      <span>Smog Gun: <strong>{s.hasAntiSmogGun ? "✅ Yes" : "❌ Missing"}</strong></span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-mono block">PM10 Reading</span>
                    <span className={`text-base font-mono font-bold ${s.currentPm10 > 150 ? "text-rose-600" : "text-emerald-600"}`}>
                      {s.currentPm10} µg/m³
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">PM2.5: {s.currentPm25}</span>
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
