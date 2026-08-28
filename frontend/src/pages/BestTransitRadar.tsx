import { useState, useEffect, useCallback } from "react"
import {
  Bus,
  Building2,
  RefreshCw,
  Sliders,
  Plus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cityOsApi, type TransitLaneObstruction } from "@/services/cityOsApi"
import { formatCurrencyINR } from "@/utils/formatters"
import toast from "react-hot-toast"

export default function BestTransitRadar() {
  const [obstructions, setObstructions] = useState<TransitLaneObstruction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState("all")

  // Dashcam Simulator State
  const [busId, setBusId] = useState("BEST-EV-902")
  const [corridor, setCorridor] = useState("Bandra-Kurla Complex Dedicated BRTS Corridor")
  const [ward] = useState("Ward H-East")
  const [plateNo, setPlateNo] = useState("MH-02-EQ-8819")
  const [vehicleType, setVehicleType] = useState("PRIVATE_CAR")
  const [delaySecs, setDelaySecs] = useState(160)
  const [isSimulating, setIsSimulating] = useState(false)

  const fetchObstructions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await cityOsApi.getTransitObstructions(selectedWard)
      setObstructions(res.obstructions)
    } catch {
      toast.error("Failed to load BEST transit lane radar")
    } finally {
      setLoading(false)
    }
  }, [selectedWard])

  useEffect(() => {
    fetchObstructions()
  }, [fetchObstructions])

  const handleSimulateDashcam = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSimulating(true)
    try {
      const res = await cityOsApi.ingestDashcamViolation({
        bestBusVehicleId: busId,
        routeCorridorName: corridor,
        ward,
        vehiclePlateNo: plateNo,
        vehicleType,
        transitDelaySeconds: delaySecs,
      })
      toast.success(res.challan.policeNotice, { icon: "📸", duration: 6000 })
      fetchObstructions()
    } catch {
      toast.error("Dashcam ingestion failed")
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
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Bus className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
              BEST Transit Lane Dashcam Vision & ANPR Challan
            </h1>
            <Badge className="bg-blue-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full">
              EDGE DASHCAM ANPR
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Real-time bus dashcam computer vision detecting unauthorized vehicles in dedicated bus priority lanes with automated Traffic Police e-challans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold"
          >
            <option value="all">All Mumbai Wards</option>
            <option value="Ward H-East">Ward H-East (BKC)</option>
            <option value="Ward K-East">Ward K-East (JVLR)</option>
            <option value="Ward H-West">Ward H-West (WEH)</option>
          </select>
          <Button
            onClick={fetchObstructions}
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
            ANPR E-Challans Issued
          </span>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-2">
            {obstructions.length} Violations
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Automated Traffic Police sync</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Cumulative Bus Delay
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
            8.3 Minutes
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">BKC, JVLR & WEH dedicated corridors</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Towing Vans Dispatched
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
            {obstructions.filter((o) => o.towingVehicleDispatched).length} Tow Trucks
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Hydraulic clearance for &gt;120s stalls</p>
        </div>
      </div>

      {/* Dashcam Ingestion Simulator & Obstruction Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Simulator */}
        <Card className="lg:col-span-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-bold font-display text-slate-900 dark:text-white">
                Simulate Bus Frontline Dashcam
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              ANPR VISION
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSimulateDashcam} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    BEST Bus ID
                  </label>
                  <input
                    type="text"
                    value={busId}
                    onChange={(e) => setBusId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Detected Vehicle Plate
                  </label>
                  <input
                    type="text"
                    value={plateNo}
                    onChange={(e) => setPlateNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  BRTS Dedicated Corridor
                </label>
                <select
                  value={corridor}
                  onChange={(e) => setCorridor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="Bandra-Kurla Complex Dedicated BRTS Corridor">BKC Dedicated BRTS Corridor</option>
                  <option value="Jogeshwari-Vikhroli Link Road (JVLR) Bus Lane">JVLR Bus Corridor</option>
                  <option value="Western Express Highway Bus Priority Sluice">WEH Bus Sluice</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Vehicle Classification
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="PRIVATE_CAR">Private Car (₹1,500 Challan)</option>
                    <option value="COMMERCIAL_TRUCK">Commercial Truck (₹3,000 Challan)</option>
                    <option value="AUTO_RICKSHAW">Auto Rickshaw (₹1,500 Challan)</option>
                    <option value="TWO_WHEELER">Two Wheeler (₹1,000 Challan)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Transit Delay (Seconds)
                  </label>
                  <input
                    type="number"
                    value={delaySecs}
                    onChange={(e) => setDelaySecs(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSimulating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold py-2 shadow-sm gap-1.5 transition-all mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSimulating ? "Processing ANPR..." : "Issue Traffic Police E-Challan"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right: Obstructions List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Active Bus Lane ANPR Challans
            </h2>
            <span className="text-xs font-mono text-slate-400">Traffic Police Automated Feed</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {obstructions.map((o) => {
              const isTowed = o.towingVehicleDispatched
              return (
                <div key={o.obstructionId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{o.obstructionId}</span>
                      <Badge
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          isTowed
                            ? "bg-rose-600 text-white animate-pulse"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {isTowed ? "TOWING DISPATCHED" : "CHALLAN ISSUED"}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                      {o.vehiclePlateNo} ({o.vehicleType.replace(/_/g, " ")})
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      Corridor: <strong>{o.routeCorridorName}</strong> • Bus: {o.bestBusVehicleId}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Delay: {o.transitDelaySeconds}s • Penalty: {formatCurrencyINR(o.challanAmountInr)}
                    </p>
                  </div>

                  <div className="text-right shrink-0 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-mono block">E-Challan Penalty</span>
                    <span className="text-base font-mono font-bold text-blue-600">
                      {formatCurrencyINR(o.challanAmountInr)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">Traffic Police E-Pay</span>
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
