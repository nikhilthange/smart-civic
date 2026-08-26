import { useState, useEffect, useCallback } from "react"
import {
  Dog,
  ShieldAlert,
  Building2,
  RefreshCw,
  Sliders,
  Send,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cityOsApi, type AnimalWelfareRecord } from "@/services/cityOsApi"
import toast from "react-hot-toast"

export default function AnimalWelfareRadar() {
  const [hotspots, setHotspots] = useState<AnimalWelfareRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState("all")

  // Log Bite / Aggression State
  const [biteWard, setBiteWard] = useState("Ward G-North")
  const [locality, setLocality] = useState("Dharavi 90 Feet Road")
  const [bitesCount, setBitesCount] = useState(16)
  const [aggressionScore, setAggressionScore] = useState(82)
  const [isLogging, setIsLogging] = useState(false)

  const fetchHotspots = useCallback(async () => {
    try {
      setLoading(true)
      const res = await cityOsApi.getAnimalHotspots(selectedWard)
      setHotspots(res.hotspots)
    } catch {
      toast.error("Failed to load animal welfare radar")
    } finally {
      setLoading(false)
    }
  }, [selectedWard])

  useEffect(() => {
    fetchHotspots()
  }, [fetchHotspots])

  const handleLogBite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLogging(true)
    try {
      const res = await cityOsApi.logBiteIncident({
        ward: biteWard,
        locality,
        dogBitesCount: bitesCount,
        packAggressionScore: aggressionScore,
      })
      if (res.riskLevel === "CRITICAL_RABIES_SURGE") {
        toast.error(`🚨 CRITICAL RABIES THREAT: Risk Score ${res.riskScore}/100. Emergency ABC sterilization drive queued.`, { duration: 6000 })
      } else {
        toast.success(`Bite incident logged. Risk Score: ${res.riskScore}/100.`, { duration: 5000 })
      }
      fetchHotspots()
    } catch {
      toast.error("Bite log ingestion failed")
    } finally {
      setIsLogging(false)
    }
  }

  const handleDispatchDrive = async (wardName: string) => {
    try {
      const res = await cityOsApi.dispatchVeterinaryDrive(wardName)
      toast.success(res.drive.dispatchOrder, { icon: "🐕", duration: 6000 })
      fetchHotspots()
    } catch {
      toast.error("Drive dispatch failed")
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-2 pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <Dog className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
              Animal Welfare (ABC), Stray Cattle & Rabies Radar
            </h1>
            <Badge className="bg-pink-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full">
              ABC STERILIZATION & RABIES RADAR
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Correlates dispensary anti-rabies serum injections with pack aggression grievances, auto-dispatching mobile sterilization and cattle impound units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold"
          >
            <option value="all">All Mumbai Wards</option>
            <option value="Ward G-North">Ward G-North (Dharavi / Dadar)</option>
            <option value="Ward H-West">Ward H-West (Bandra)</option>
            <option value="Ward K-West">Ward K-West (Andheri)</option>
          </select>
          <Button
            onClick={fetchHotspots}
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
            Critical Rabies Surge Sectors
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
            {hotspots.filter((h) => h.riskLevel === "CRITICAL_RABIES_SURGE").length} Clusters
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">&gt;12 bites / 30 days + pack aggression</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            ABC Sterilization Rate
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            78.4%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Ear-notched & anti-rabies vaccinated</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Stray Cattle Road Impounds
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
            {hotspots.filter((h) => h.cattleImpoundStatus === "ROAMING_FREE_ROAD_HAZARD").length} Active Hazards
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Municipal corral squad dispatched</p>
        </div>
      </div>

      {/* Bite Ingestion & Hotspots List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Log Bite */}
        <Card className="lg:col-span-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-pink-600" />
              <CardTitle className="text-sm font-bold font-display text-slate-900 dark:text-white">
                Log Dog-Bite / Rabies Telemetry
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-pink-600 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
              DISPENSARY SYNC
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleLogBite} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Ward
                  </label>
                  <select
                    value={biteWard}
                    onChange={(e) => setBiteWard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="Ward G-North">Ward G-North</option>
                    <option value="Ward H-West">Ward H-West</option>
                    <option value="Ward K-West">Ward K-West</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Reported Bites (30D)
                  </label>
                  <input
                    type="number"
                    value={bitesCount}
                    onChange={(e) => setBitesCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Locality / Sector
                </label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold">
                    Pack Aggression Index (0 - 100)
                  </label>
                  <span className="font-mono font-bold text-pink-600">{aggressionScore} / 100</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={aggressionScore}
                  onChange={(e) => setAggressionScore(Number(e.target.value))}
                  className="w-full accent-pink-600 cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                disabled={isLogging}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold py-2 shadow-sm gap-1.5 transition-all mt-2"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isLogging ? "Recalculating Risk..." : "Log Bite Incident & Update Ward Radar"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right: Animal Welfare Clusters */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-pink-600" />
              Rabies Bite Hotspots & Cattle Hazard Clusters
            </h2>
            <span className="text-xs font-mono text-slate-400">Veterinary ABC Drive Queue</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {hotspots.map((h) => {
              const isCritical = h.riskLevel === "CRITICAL_RABIES_SURGE"
              const isCattle = h.animalType === "BOVINE_CATTLE"

              return (
                <div key={h.recordId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{h.recordId}</span>
                      <Badge
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          isCritical
                            ? "bg-rose-600 text-white animate-pulse"
                            : isCattle
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {h.riskLevel.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                      {h.locality} ({h.animalType.replace(/_/g, " ")})
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      {h.ward} • Sterilization: <strong>{h.sterilizationStatus.replace(/_/g, " ")}</strong> • RFID: {h.rfidMicrochipId || "Unchipped"}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Bites (30D): {h.reportedDogBites30Days} • Aggression Index: {h.packAggressionScore}/100
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleDispatchDrive(h.ward)}
                      className="bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-semibold h-8 rounded-xl gap-1.5 shadow-sm"
                    >
                      <Send className="w-3 h-3" />
                      <span>Dispatch Van</span>
                    </Button>
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
