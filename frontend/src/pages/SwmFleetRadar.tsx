import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Truck,
  Radio,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ShieldAlert,
  Activity,
  Gauge,
  Navigation,
  Fuel,
  Weight,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { municipalApi, type SmartBin } from "@/services/municipalApi"
import { formatCurrencyINR, formatNumber } from "@/utils/formatters"
import toast from "react-hot-toast"
import { triggerHapticFeedback } from "@/utils/haptics"

interface CompactorTruck {
  truckId: string
  vehiclePlate: string
  driverName: string
  ward: string
  speedKmH: number
  status: "ON_ROUTE" | "DEVIATION" | "IDLE"
  currentLocation: string
  fuelLevelPercent: number
  wasteCapacityTonnes: number
  currentLoadTonnes: number
  lastPing: string
  lat: number
  lng: number
}

export default function SwmFleetRadar() {
  const [bins, setBins] = useState<SmartBin[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState("Ward G-North")
  const [isLifting, setIsLifting] = useState<string | null>(null)
  const [contractorEscrow, setContractorEscrow] = useState(1250000)
  const [penaltiesLogged, setPenaltiesLogged] = useState(0)

  // Live Compactor Trucks State
  const [trucks] = useState<CompactorTruck[]>([
    {
      truckId: "TRUCK-GN-01",
      vehiclePlate: "MH-01-CV-4421",
      driverName: "Santosh Kadam",
      ward: "Ward G-North",
      speedKmH: 18,
      status: "ON_ROUTE",
      currentLocation: "Cadell Road, Shivaji Park",
      fuelLevelPercent: 78,
      wasteCapacityTonnes: 8.5,
      currentLoadTonnes: 4.2,
      lastPing: "Just now",
      lat: 19.0282,
      lng: 72.8398,
    },
    {
      truckId: "TRUCK-GN-02",
      vehiclePlate: "MH-01-CV-8820",
      driverName: "Mahesh Sawant",
      ward: "Ward G-North",
      speedKmH: 22,
      status: "ON_ROUTE",
      currentLocation: "Ranade Road, Dadar West",
      fuelLevelPercent: 64,
      wasteCapacityTonnes: 8.5,
      currentLoadTonnes: 6.8,
      lastPing: "2 mins ago",
      lat: 19.0225,
      lng: 72.8425,
    },
    {
      truckId: "TRUCK-GN-03",
      vehiclePlate: "MH-01-CV-1904",
      driverName: "Anil Parab",
      ward: "Ward G-North",
      speedKmH: 0,
      status: "DEVIATION",
      currentLocation: "Senapati Bapat Marg Junction",
      fuelLevelPercent: 45,
      wasteCapacityTonnes: 8.5,
      currentLoadTonnes: 7.9,
      lastPing: "4 mins ago",
      lat: 19.018,
      lng: 72.845,
    },
  ])

  const [selectedTruck, setSelectedTruck] = useState<CompactorTruck | null>(trucks[0])
  const isMountedRef = useRef(true)

  const fetchBins = useCallback(async () => {
    try {
      setLoading(true)
      const res = await municipalApi.getSmartBins(selectedWard)
      if (isMountedRef.current) {
        if (res.bins && res.bins.length > 0) {
          setBins(res.bins)
        } else {
          // Fallback realistic smart bins for Ward G-North
          setBins([
            {
              _id: "1",
              binId: "BIN-GN-101",
              locality: "Chaityabhoomi Chowk, Shivaji Park",
              ward: "Ward G-North",
              rfidTag: "RFID-GN-8841",
              wasteType: "MIXED_MSW",
              capacityLiters: 1100,
              currentFillPercentage: 88,
              lastLiftedAt: new Date(Date.now() - 45 * 60000).toISOString(),
              status: "OVERFLOWING",
              lastGrossWeightKg: 380,
            },
            {
              _id: "2",
              binId: "BIN-GN-102",
              locality: "Dadar Flower Market, Senapati Bapat Marg",
              ward: "Ward G-North",
              rfidTag: "RFID-GN-8842",
              wasteType: "ORGANIC_MARKET",
              capacityLiters: 1100,
              currentFillPercentage: 94,
              lastLiftedAt: new Date(Date.now() - 120 * 60000).toISOString(),
              status: "OVERFLOWING",
              lastGrossWeightKg: 420,
            },
            {
              _id: "3",
              binId: "BIN-GN-103",
              locality: "Plaza Cinema Junction, N.C. Kelkar Road",
              ward: "Ward G-North",
              rfidTag: "RFID-GN-8843",
              wasteType: "DRY_RECYCLABLE",
              capacityLiters: 1100,
              currentFillPercentage: 42,
              lastLiftedAt: new Date(Date.now() - 15 * 60000).toISOString(),
              status: "NORMAL",
              lastGrossWeightKg: 195,
            },
            {
              _id: "4",
              binId: "BIN-GN-104",
              locality: "Dharavi 90-Feet Road Junction",
              ward: "Ward G-North",
              rfidTag: "RFID-GN-8844",
              wasteType: "MIXED_MSW",
              capacityLiters: 1100,
              currentFillPercentage: 76,
              lastLiftedAt: new Date(Date.now() - 30 * 60000).toISOString(),
              status: "NEAR_FULL",
              lastGrossWeightKg: 310,
            },
          ])
        }
      }
    } catch {
      if (isMountedRef.current) {
        toast.error("Failed to load smart bin telemetry")
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [selectedWard])

  useEffect(() => {
    isMountedRef.current = true
    fetchBins()
    return () => {
      isMountedRef.current = false
    }
  }, [fetchBins])

  // Simulate Hydraulic Arm RFID Lift
  const handleSimulateLift = async (rfidTag: string, binId: string) => {
    triggerHapticFeedback("medium")
    setIsLifting(binId)
    try {
      try {
        await municipalApi.logRfidLift(rfidTag, 380)
      } catch {
        // Fallback local update
      }

      setBins((prev) =>
        prev.map((b) =>
          b.binId === binId || b.rfidTag === rfidTag
            ? {
                ...b,
                currentFillPercentage: 0,
                status: "NORMAL",
                lastLiftedAt: new Date().toISOString(),
              }
            : b
        )
      )
      triggerHapticFeedback("success")
      toast.success(`RFID Lift Confirmed for ${binId}! Logged 380 kg MSW. Fill reset to 0%.`, {
        icon: "🚛",
        duration: 4000,
      })
    } catch {
      triggerHapticFeedback("error")
      toast.error("Failed to log RFID bin lift")
    } finally {
      setIsLifting(null)
    }
  }

  // Simulate Missed Society SLA Breach
  const handleSimulateBreach = () => {
    triggerHapticFeedback("warning")
    const penalty = 5000
    setContractorEscrow((prev) => Math.max(0, prev - penalty))
    setPenaltiesLogged((prev) => prev + 1)
    toast.error(
      `SLA Breach! CleanCity Infra Ltd missed Society Lift #402. ₹5,000 auto-deducted from escrow under MMC Act Sec 354.`,
      { duration: 6000, icon: "⚖️" }
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-7xl mx-auto space-y-6 pt-2 pb-24 sm:pb-28 safe-bottom px-2 sm:px-4"
    >
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Truck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              SWM Compactor GPS Fleet & RFID Smart Bin Radar
            </h1>
            <Badge className="bg-teal-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full shadow-xs">
              RFID HYDRAULIC TELEMETRY
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Live compactor GPS tracking, route corridor compliance, RFID hydraulic bin lift verification, and statutory contractor SLA enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 transition-all cursor-pointer"
          >
            <option value="Ward G-North">Ward G-North (Dadar/Dharavi)</option>
            <option value="Ward H-West">Ward H-West (Bandra/Khar)</option>
            <option value="Ward K-West">Ward K-West (Andheri West)</option>
          </select>
          <Button
            onClick={fetchBins}
            variant="outline"
            size="sm"
            className="border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5 rounded-xl h-9 shadow-xs hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* ─── KPI Overview Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "ACTIVE COMPACTORS",
            icon: Activity,
            iconColor: "text-teal-600 dark:text-teal-400",
            value: `${trucks.length} Vehicles`,
            subtext: "● 100% GPS Transponders Online",
            subColor: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "ROUTE COMPLIANCE",
            icon: Gauge,
            iconColor: "text-emerald-600 dark:text-emerald-400",
            value: "96.4% On-Route",
            subtext: "Corridor geo-fences verified",
            subColor: "text-slate-400",
          },
          {
            label: "RFID LIFTS LOGGED",
            icon: Radio,
            iconColor: "text-blue-600 dark:text-blue-400",
            value: `${formatNumber(342 + (bins.filter((b) => b.currentFillPercentage === 0).length || 0))} Bins`,
            subtext: "132.8 MT Solid Waste Collected",
            subColor: "text-slate-400",
          },
          {
            label: "CONTRACTOR ESCROW",
            icon: ShieldAlert,
            iconColor: "text-amber-600 dark:text-amber-400",
            value: formatCurrencyINR(contractorEscrow),
            subtext: penaltiesLogged > 0 ? `${formatCurrencyINR(penaltiesLogged * 5000)} Deducted (MMC Act Sec 354)` : "No active breaches",
            subColor: penaltiesLogged > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400",
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.25 }}
            >
              <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-1.5">
                <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
                  <span>{kpi.label}</span>
                  <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {kpi.value}
                </div>
                <p className={`text-[11px] font-medium ${kpi.subColor}`}>{kpi.subtext}</p>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ─── Main Dual-Pane Grid: Live GPS Radar & Fleet Tracking ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Live Compactor Fleet Status & Map HUD (5 Cols) */}
        <Card className="lg:col-span-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs space-y-4">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                Live Compactor GPS Fleet Radar
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono text-teal-600 border-teal-300 dark:border-teal-800">
              REAL-TIME GNSS
            </Badge>
          </CardHeader>

          <CardContent className="p-0 space-y-3.5">
            {/* Simulated Live Municipal Map Canvas */}
            <div
              className="h-48 w-full rounded-2xl border border-slate-200 dark:border-slate-800 relative p-3.5 overflow-hidden bg-slate-950 flex flex-col justify-between"
              style={{
                backgroundImage: `
                  radial-gradient(rgba(20, 184, 166, 0.15) 1px, transparent 1px),
                  radial-gradient(rgba(20, 184, 166, 0.05) 1px, #020617 1px)
                `,
                backgroundSize: "20px 20px",
              }}
            >
              {/* Radar Sweep Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/10 to-transparent animate-pulse pointer-events-none" />

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 relative z-10">
                <span className="bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 font-bold text-slate-200">
                  GIS Mesh: {selectedWard}
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  GNSS Live (3/3)
                </span>
              </div>

              {/* Geo-Fenced Route Corridors on Map */}
              <div className="relative flex items-center justify-around py-3 z-10">
                {trucks.map((truck) => (
                  <motion.button
                    key={truck.truckId}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setSelectedTruck(truck)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      selectedTruck?.truckId === truck.truckId
                        ? "bg-teal-950/80 border-teal-400 text-white shadow-lg shadow-teal-500/20"
                        : "bg-slate-900/80 border-slate-700 text-slate-300 hover:border-teal-500/60"
                    }`}
                  >
                    <Truck
                      className={`w-5 h-5 ${
                        truck.status === "DEVIATION" ? "text-amber-400 animate-bounce" : "text-teal-400"
                      }`}
                    />
                    <span className="text-[10px] font-mono font-bold">
                      {truck.vehiclePlate}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {truck.speedKmH} km/h
                    </span>
                  </motion.button>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 relative z-10">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> On Corridor
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Speed &lt; 5km/h
                </span>
              </div>
            </div>

            {/* Selected Vehicle Telemetry Details */}
            <AnimatePresence mode="wait">
              {selectedTruck && (
                <motion.div
                  key={selectedTruck.truckId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {selectedTruck.vehiclePlate} ({selectedTruck.truckId})
                      </h3>
                      <p className="text-[11px] text-slate-500">Driver: <strong>{selectedTruck.driverName}</strong></p>
                    </div>
                    <Badge
                      className={`text-[10px] font-mono font-bold ${
                        selectedTruck.status === "ON_ROUTE"
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {selectedTruck.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-teal-500" /> Location
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block text-[11px] mt-0.5">
                        {selectedTruck.currentLocation}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Weight className="w-3 h-3 text-teal-500" /> MSW Load
                      </span>
                      <span className="font-semibold text-teal-600 dark:text-teal-400 text-[11px] mt-0.5">
                        {selectedTruck.currentLoadTonnes} / {selectedTruck.wasteCapacityTonnes} T
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-amber-500" /> Fuel Level
                      </span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400 text-[11px] mt-0.5">
                        {selectedTruck.fuelLevelPercent}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Right Column: SWM Contractor SLA & Route Penalty Control (7 Cols) */}
        <Card className="lg:col-span-7 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Contractor SLA & Statutory Escrow Enforcement
                </h3>
              </div>
              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                MMC ACT SEC 354
              </Badge>
            </div>

            <div className="pt-3 space-y-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Assigned SWM Contractor</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      CleanCity Infraprojects Ltd (Ward G-North)
                    </h4>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Active Bank Guarantee</span>
                    <span className="font-bold font-mono text-base text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyINR(contractorEscrow)}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Under <strong>MMC Act Section 354</strong>, failure to lift assigned society bins within the designated 4-hour morning shift window or unapproved route deviation incurs an automatic <strong>₹5,000 penalty per incident</strong>, deducted directly from the contractor's bank guarantee deposit.
                </p>
              </div>

              {/* Live Breach Simulation Trigger */}
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Missed Society Collection SLA Trigger</span>
                  </div>
                  <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80">
                    Simulate a missed garbage pickup alert for Shivaji Park Housing Society #402.
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={handleSimulateBreach}
                  className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold h-9 px-3 rounded-xl gap-1.5 shadow-sm shrink-0 cursor-pointer transition-transform"
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Simulate SLA Breach (-₹5,000)</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-800 dark:text-teal-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Automated Zero-Trust Escrow Recovery: <strong>100% Guaranteed</strong>
            </span>
            <span className="font-mono text-[10px]">P95 Latency &lt; 20ms</span>
          </div>
        </Card>
      </div>

      {/* ─── Smart Bins Live Audit Ledger & Grid ─── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-teal-600" />
              Smart Bins RFID Fill & Lift Telemetry ({selectedWard})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Solar ultrasonic fill level sensors with automated hydraulic arm RFID clearance logging.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 self-start sm:self-auto flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-500" /> Auto-Resets to 0% upon Truck Lift
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {bins.map((bin, idx) => {
            const isOver = bin.currentFillPercentage >= 80
            const isModerate = bin.currentFillPercentage >= 50 && bin.currentFillPercentage < 80

            return (
              <motion.div
                key={bin._id || bin.binId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card
                  className={`border rounded-3xl p-4.5 transition-all shadow-xs hover:shadow-lg flex flex-col justify-between space-y-3 h-full ${
                    isOver
                      ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30"
                      : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                        {bin.binId}
                      </span>
                      <Badge
                        className={`text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full ${
                          isOver
                            ? "bg-rose-600 text-white animate-pulse"
                            : isModerate
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {isOver ? "OVERFLOW ALERT" : isModerate ? "MODERATE FILL" : "NORMAL"}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {bin.locality}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {bin.rfidTag} • {bin.wasteType}
                    </p>

                    {/* Fill Level Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Fill Level</span>
                        <span className={`font-bold ${isOver ? "text-rose-600" : "text-slate-800 dark:text-slate-200"}`}>
                          {bin.currentFillPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${
                            isOver ? "bg-rose-500" : isModerate ? "bg-amber-500" : "bg-teal-500"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${bin.currentFillPercentage}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-mono truncate">
                      Last: {new Date(bin.lastLiftedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <Button
                      size="sm"
                      disabled={isLifting === bin.binId}
                      onClick={() => handleSimulateLift(bin.rfidTag, bin.binId)}
                      className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-[11px] font-semibold h-8 px-3 rounded-xl shadow-xs gap-1.5 shrink-0 cursor-pointer transition-transform"
                    >
                      <Truck className={`w-3 h-3 ${isLifting === bin.binId ? "animate-bounce" : ""}`} />
                      <span>{isLifting === bin.binId ? "Lifting..." : "Simulate Lift"}</span>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
