import { useState, useEffect, useCallback } from "react"
import {
  Trees,
  ShieldAlert,
  RefreshCw,
  Sliders,
  Send,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cityOsApi, type MangroveZone } from "@/services/cityOsApi"
import toast from "react-hot-toast"

export default function CoastalSentinel() {
  const [zones, setZones] = useState<MangroveZone[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState("all")

  // Simulator State
  const [simZoneId, setSimZoneId] = useState("CRZ-KW-01")
  const [simCurrentNdvi, setSimCurrentNdvi] = useState(0.48)
  const [simDumping, setSimDumping] = useState(true)
  const [simResult, setSimResult] = useState<any>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true)
      const res = await cityOsApi.getMangroveZones(selectedWard)
      setZones(res.zones)
    } catch {
      toast.error("Failed to load coastal mangrove scan data")
    } finally {
      setLoading(false)
    }
  }, [selectedWard])

  useEffect(() => {
    fetchZones()
  }, [fetchZones])

  const handleSimulateScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSimulating(true)
    try {
      const res = await cityOsApi.ingestCoastalScan({
        zoneId: simZoneId,
        baselineNdvi: 0.78,
        currentNdvi: simCurrentNdvi,
        debrisDumpingDetected: simDumping,
      })
      setSimResult(res)
      if (res.isCriticalLoss) {
        toast.error(res.auditSummary, { icon: "🚨", duration: 7000 })
      } else {
        toast.success(res.auditSummary, { duration: 5000 })
      }
      fetchZones()
    } catch {
      toast.error("Satellite raster scan ingestion failed")
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
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Trees className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
              Mangrove & CRZ-I Satellite / Drone Sentinel
            </h1>
            <Badge className="bg-emerald-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full">
              SATELLITE NDVI SCANNER
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Automated change detection in coastal vegetation indices and instant cease-and-desist injunctions for CRZ-I destruction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold"
          >
            <option value="all">All Mumbai Wards</option>
            <option value="Ward K-West">Ward K-West (Versova)</option>
            <option value="Ward G-North">Ward G-North (Mahim)</option>
            <option value="Ward R-North">Ward R-North (Gorai)</option>
          </select>
          <Button
            onClick={fetchZones}
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
            Statutory CRZ Buffer
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            50 Meters
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">High Court mandated no-development zone</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Active Deforestation Injunctions
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
            {zones.filter((z) => z.status === "CRITICAL_CRZ_DESTRUCTION").length} Sectors
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Dispatched to State Mangrove Cell</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Canopy Health Index
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            0.74 NDVI
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Satellite multi-spectral raster telemetry</p>
        </div>
      </div>

      {/* Scan Simulator & Protected Belts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Scan Simulator */}
        <Card className="lg:col-span-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-bold font-display text-slate-900 dark:text-white">
                Simulate Satellite NDVI Scan
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              NDVI RASTER
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSimulateScan} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Target Coastal Mangrove Belt
                </label>
                <select
                  value={simZoneId}
                  onChange={(e) => setSimZoneId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="CRZ-KW-01">Versova Creek & Mudflats (Ward K-West)</option>
                  <option value="CRZ-GN-02">Mahim Nature Park & Mithi Estuary (Ward G-North)</option>
                  <option value="CRZ-RN-03">Gorai Creek & Pagoda Mangroves (Ward R-North)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold">
                    Current Satellite NDVI (Canopy Index)
                  </label>
                  <span className={`font-mono font-bold ${simCurrentNdvi < 0.58 ? "text-rose-600" : "text-emerald-600"}`}>
                    {simCurrentNdvi} (Base: 0.78)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="0.85"
                  step="0.01"
                  value={simCurrentNdvi}
                  onChange={(e) => setSimCurrentNdvi(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Debris / Soil Dumping Detected inside 50m Buffer
                </span>
                <input
                  type="checkbox"
                  checked={simDumping}
                  onChange={(e) => setSimDumping(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                disabled={isSimulating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold py-2 shadow-sm gap-1.5 transition-all mt-2"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isSimulating ? "Analyzing NDVI Raster..." : "Ingest Scan & Check Injunction Order"}</span>
              </Button>
            </form>

            {simResult?.injunction && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold">
                  <Send className="w-3.5 h-3.5" />
                  <span>Statutory Cease-and-Desist Injunction Issued</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-rose-100 dark:border-rose-900">
                  {simResult.injunction.injunctionOrder}
                </p>
                <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                  <span>Authority: <strong>{simResult.injunction.authorityNotified}</strong></span>
                  <span>Loss: {simResult.injunction.vegetationLossPercentage}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Mangrove Zones List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Trees className="w-4 h-4 text-emerald-600" />
              Protected CRZ-I Mangrove Belts Telemetry
            </h2>
            <span className="text-xs font-mono text-slate-400">Satellite Multi-Spectral</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {zones.map((z) => {
              const isCritical = z.status === "CRITICAL_CRZ_DESTRUCTION"
              return (
                <div key={z.zoneId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{z.zoneId}</span>
                      <Badge
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          isCritical
                            ? "bg-rose-600 text-white animate-pulse"
                            : z.vegetationLossPercentage > 10
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {z.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                      {z.zoneName}
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      {z.ward} • {z.crzClassification} • Debris Dump: <strong>{z.debrisDumpingDetected ? "🚨 Yes" : "✅ Clear"}</strong>
                    </p>
                    {z.injunctionNoticeIssued && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-mono font-semibold">
                        🚨 Injunction Active: State Mangrove Cell Enforcing Order
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-mono block">NDVI Loss</span>
                    <span className={`text-base font-mono font-bold ${isCritical ? "text-rose-600" : "text-emerald-600"}`}>
                      {z.vegetationLossPercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">Current: {z.currentNdvi}</span>
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
