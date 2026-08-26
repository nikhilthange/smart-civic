import { useState, useEffect, useCallback } from "react"
import {
  Truck,
  Radio,
  RefreshCw,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { municipalApi, type SmartBin } from "@/services/municipalApi"
import toast from "react-hot-toast"

export default function SwmFleetRadar() {
  const [bins, setBins] = useState<SmartBin[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState("Ward G-North")
  const [isLifting, setIsLifting] = useState(false)

  const fetchBins = useCallback(async () => {
    try {
      setLoading(true)
      const res = await municipalApi.getSmartBins(selectedWard)
      if (res.bins.length > 0) {
        setBins(res.bins)
      } else {
        // Fallback demo smart bins
        setBins([
          {
            _id: "1",
            binId: "BIN-GN-01",
            rfidTag: "RFID-90812-GN",
            ward: "Ward G-North",
            locality: "Plaza Cinema Waste Hub",
            capacityLiters: 1100,
            currentFillPercentage: 88,
            status: "OVERFLOWING",
            wasteType: "MIXED_MSW",
            lastLiftedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
            lastGrossWeightKg: 420,
          },
          {
            _id: "2",
            binId: "BIN-GN-02",
            rfidTag: "RFID-44120-GN",
            ward: "Ward G-North",
            locality: "Shivaji Park Gate 4",
            capacityLiters: 1100,
            currentFillPercentage: 20,
            status: "NORMAL",
            wasteType: "WET_WASTE",
            lastLiftedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
            lastGrossWeightKg: 380,
          },
          {
            _id: "3",
            binId: "BIN-GN-03",
            rfidTag: "RFID-87291-GN",
            ward: "Ward G-North",
            locality: "Portuguese Church Sector",
            capacityLiters: 1100,
            currentFillPercentage: 0,
            status: "CLEANED",
            wasteType: "DRY_RECYCLABLE",
            lastLiftedAt: new Date(Date.now() - 15 * 60000).toISOString(),
            lastGrossWeightKg: 310,
          },
        ])
      }
    } catch {
      toast.error("Failed to load smart bin telemetry")
    } finally {
      setLoading(false)
    }
  }, [selectedWard])

  useEffect(() => {
    fetchBins()
  }, [fetchBins])

  const handleSimulateLift = async (rfidTag: string) => {
    setIsLifting(true)
    try {
      const res = await municipalApi.logRfidLift(rfidTag, 395)
      toast.success(res.message, { duration: 5000 })
      fetchBins()
    } catch {
      toast.error("Failed to log RFID bin lift")
    } finally {
      setIsLifting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-2 pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Truck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
              SWM Compactor GPS Fleet & RFID Bin Audit
            </h1>
            <Badge className="bg-teal-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full">
              RFID HYDRAULIC TELEMETRY
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Real-time compactor route corridor compliance, missed society alerts, and automated RFID bin clearance logging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold"
          >
            <option value="Ward G-North">Ward G-North (Dadar)</option>
            <option value="Ward H-West">Ward H-West (Bandra)</option>
            <option value="Ward K-West">Ward K-West (Andheri)</option>
          </select>
          <Button
            onClick={fetchBins}
            variant="outline"
            size="sm"
            className="border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5 rounded-xl h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Top Compactor Fleet Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Active Compactor Trucks
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            14 Vehicles
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">● 100% GPS Transponders Active</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Ward Route Compliance
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            96.4% On-Corridor
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Zero missed society skips reported today</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            RFID Lifts Logged Today
          </span>
          <div className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-2">
            342 Smart Bins
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Total MSW tonnage: 132.8 MT</p>
        </div>
      </div>

      {/* Smart Bins Live Audit Ledger */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-teal-600" />
            Smart Bins RFID Fill Telemetry ({selectedWard})
          </h2>
          <span className="text-xs font-mono text-slate-400">Auto-Reset upon Truck Lift</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bins.map((bin) => {
            const isOver = bin.currentFillPercentage >= 80
            return (
              <Card
                key={bin._id || bin.binId}
                className={`border rounded-2xl p-4 transition-all ${
                  isOver
                    ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/[0.08]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-500">{bin.binId}</span>
                  <Badge
                    className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                      isOver ? "bg-rose-600 text-white animate-pulse" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {bin.status}
                  </Badge>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                  {bin.locality}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{bin.rfidTag} • {bin.wasteType}</p>

                {/* Fill Level Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Fill Level</span>
                    <span className="font-bold">{bin.currentFillPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isOver ? "bg-rose-500" : "bg-teal-500"
                      }`}
                      style={{ width: `${bin.currentFillPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Last Lift: {new Date(bin.lastLiftedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Button
                    size="sm"
                    disabled={isLifting}
                    onClick={() => handleSimulateLift(bin.rfidTag)}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold h-7 px-2.5 rounded-lg shadow-sm gap-1"
                  >
                    <Truck className="w-3 h-3" />
                    <span>Log Lift</span>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
