import { useState, useEffect, useCallback } from "react"
import {
  Droplets,
  RefreshCw,
  QrCode,
  Plus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { advancedMunicipalApi, type WaterFlowZone, type WaterTankerPass } from "@/services/advancedMunicipalApi"
import toast from "react-hot-toast"

export default function WaterGovernance() {
  const [zones, setZones] = useState<WaterFlowZone[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState("all")

  // Tanker Form State
  const [tankerNo, setTankerNo] = useState("MH-01-AN-9921")
  const [driverName, setDriverName] = useState("Suresh Patil")
  const [driverMobile, setDriverMobile] = useState("9820199182")
  const [capacity, setCapacity] = useState(10000)
  const [destinationSociety, setDestinationSociety] = useState("Raheja Horizon CHS, Bandra West")
  const [destinationWard, setDestinationWard] = useState("Ward H-West")
  const [maxPrice, setMaxPrice] = useState(1800)
  const [generatedPass, setGeneratedPass] = useState<WaterTankerPass | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true)
      const res = await advancedMunicipalApi.getWaterAuditZones(selectedWard)
      setZones(res.zones)
    } catch {
      toast.error("Failed to load water audit zones")
    } finally {
      setLoading(false)
    }
  }, [selectedWard])

  useEffect(() => {
    fetchZones()
  }, [fetchZones])

  const handleGeneratePass = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    try {
      const res = await advancedMunicipalApi.createTankerTripPass({
        tankerRegistrationNo: tankerNo,
        driverName,
        driverMobile,
        capacityLiters: capacity,
        destinationSociety,
        destinationWard,
        maxCappedRateInr: maxPrice,
      })
      setGeneratedPass(res.pass)
      toast.success(`Tanker Pass ${res.pass.tripPassId} generated with SHA256 QR signature!`, { icon: "💧" })
    } catch {
      toast.error("Failed to generate tanker pass")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-2 pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Droplets className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
              Non-Revenue Water (NRW) Audit & QR Tanker Tracking
            </h1>
            <Badge className="bg-sky-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full">
              BMC HYDRAULIC GOVERNANCE
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            District Metered Area (DMA) pipeline differential loss monitoring and cryptographically signed QR water tanker manifests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold"
          >
            <option value="all">All Mumbai Wards</option>
            <option value="Ward G-North">Ward G-North (Dadar)</option>
            <option value="Ward H-West">Ward H-West (Bandra)</option>
            <option value="Ward K-West">Ward K-West (Andheri)</option>
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
            Avg Transmission Loss
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
            15.2% MLD
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Statutory target: &lt; 18.0% unaccounted water</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Critical Leak / Theft Sectors
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
            {zones.filter((z) => z.lossPercentage > 18).length} DMA Zones
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Acoustic leak patrol dispatched</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Statutory Tanker Price Cap
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            ₹1,800 / 10,000L
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Zero black-market price gouging</p>
        </div>
      </div>

      {/* QR Tanker Dispatch Form + DMA Zones Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dispatch Form */}
        <Card className="lg:col-span-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-sky-600" />
              <CardTitle className="text-sm font-bold font-display text-slate-900 dark:text-white">
                Generate QR Tanker Trip Pass
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-sky-600 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
              HMAC-SHA256
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleGeneratePass} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Tanker Reg No
                  </label>
                  <input
                    type="text"
                    value={tankerNo}
                    onChange={(e) => setTankerNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Capacity (Liters)
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Driver Mobile
                  </label>
                  <input
                    type="text"
                    value={driverMobile}
                    onChange={(e) => setDriverMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Destination Housing Society
                </label>
                <input
                  type="text"
                  value={destinationSociety}
                  onChange={(e) => setDestinationSociety(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Destination Ward
                  </label>
                  <select
                    value={destinationWard}
                    onChange={(e) => setDestinationWard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="Ward H-West">Ward H-West</option>
                    <option value="Ward G-North">Ward G-North</option>
                    <option value="Ward K-West">Ward K-West</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Statutory Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold py-2 shadow-sm gap-1.5 transition-all mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isGenerating ? "Signing Manifest..." : "Issue Cryptographic QR Tanker Pass"}</span>
              </Button>
            </form>

            {generatedPass && (
              <div className="mt-4 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-mono font-bold text-sky-800 dark:text-sky-300">
                  <span>Pass ID: {generatedPass.tripPassId}</span>
                  <Badge className="bg-sky-600 text-white text-[10px]">SIGNED</Badge>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Destination: {generatedPass.destinationSociety}
                </p>
                <p className="text-[10px] font-mono text-slate-400 break-all">
                  Signature: {generatedPass.qrSignatureHash.slice(0, 32)}...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: DMA Zones Loss Audit */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Droplets className="w-4 h-4 text-sky-600" />
              DMA Flow Loss Differential Radar
            </h2>
            <span className="text-xs font-mono text-slate-400">Master vs Aggregate DMA</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {zones.map((z) => {
              const isCritical = z.lossPercentage > 18
              return (
                <div key={z.zoneId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{z.zoneId}</span>
                      <Badge
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          isCritical
                            ? "bg-rose-600 text-white animate-pulse"
                            : z.lossPercentage > 10
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
                    <p className="text-xs text-slate-500 font-mono">
                      Inflow: <strong>{z.masterReservoirInflowMld} MLD</strong> • Consumed: <strong>{z.aggregateDmaOutflowMld} MLD</strong> • Pressure: {z.pipelinePressurePsi} PSI
                    </p>
                  </div>

                  <div className="text-right shrink-0 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-mono block">Unaccounted Loss</span>
                    <span className={`text-base font-mono font-bold ${isCritical ? "text-rose-600" : "text-slate-800 dark:text-slate-200"}`}>
                      {z.lossPercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">{(z.masterReservoirInflowMld - z.aggregateDmaOutflowMld).toFixed(1)} MLD</span>
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
