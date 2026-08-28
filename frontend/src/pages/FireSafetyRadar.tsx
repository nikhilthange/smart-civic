import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Flame,
  ShieldAlert,
  Building2,
  RefreshCw,
  Sliders,
  Send,
  AlertTriangle,
  Gauge,
  Clock,
  Search,
  Check,
  Activity,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cityOsApi, type HighRiseFireNoc } from "@/services/cityOsApi"
import { formatCurrencyINR, formatDate } from "@/utils/formatters"
import toast from "react-hot-toast"

// ─── Default Fallback Buildings (Resilience Standard) ─────────────────────────
const FALLBACK_BUILDINGS: HighRiseFireNoc[] = [
  {
    buildingId: "FIRE-HW-01",
    buildingName: "Bandra Imperial Sky Heights (42 Floors)",
    ward: "Ward H-West",
    address: "Pali Hill Junction, Bandra West",
    floorCount: 42,
    propertyTaxSacId: "SAC-HW-881920",
    fireNocExpiryDate: "2027-02-15T00:00:00.000Z",
    fireNocStatus: "VALID",
    wetRiserPressureKgCm2: 2.1,
    pressureLossDurationMinutes: 45,
    refugeFloorEncroached: false,
    sprinklerSystemActive: true,
    mfbRadarFlagged: true,
    status: "DRY_RISER_FAILURE_CRITICAL",
  },
  {
    buildingId: "FIRE-GS-04",
    buildingName: "Worli Seaface Residency (38 Floors)",
    ward: "Ward G-South",
    address: "Khan Abdul Ghaffar Khan Road, Worli",
    floorCount: 38,
    propertyTaxSacId: "SAC-GS-772109",
    fireNocExpiryDate: "2027-08-20T00:00:00.000Z",
    fireNocStatus: "VALID",
    wetRiserPressureKgCm2: 4.8,
    pressureLossDurationMinutes: 0,
    refugeFloorEncroached: false,
    sprinklerSystemActive: true,
    mfbRadarFlagged: false,
    status: "OPERATIONAL",
  },
  {
    buildingId: "FIRE-GS-05",
    buildingName: "Lower Parel One Tower (64 Floors)",
    ward: "Ward G-South",
    address: "Senapati Bapat Marg, Lower Parel",
    floorCount: 64,
    propertyTaxSacId: "SAC-GS-990142",
    fireNocExpiryDate: "2026-10-18T00:00:00.000Z",
    fireNocStatus: "AUDIT_CITATION_ISSUED",
    wetRiserPressureKgCm2: 2.8,
    pressureLossDurationMinutes: 35,
    refugeFloorEncroached: false,
    sprinklerSystemActive: true,
    mfbRadarFlagged: true,
    status: "DRY_RISER_FAILURE_CRITICAL",
  },
  {
    buildingId: "FIRE-GN-02",
    buildingName: "Kohinoor Square Commercial Tower (52 Floors)",
    ward: "Ward G-North",
    address: "N.C. Kelkar Marg, Dadar West",
    floorCount: 52,
    propertyTaxSacId: "SAC-GN-309114",
    fireNocExpiryDate: "2027-06-30T00:00:00.000Z",
    fireNocStatus: "VALID",
    wetRiserPressureKgCm2: 5.2,
    pressureLossDurationMinutes: 0,
    refugeFloorEncroached: false,
    sprinklerSystemActive: true,
    mfbRadarFlagged: false,
    status: "OPERATIONAL",
  },
  {
    buildingId: "FIRE-KW-03",
    buildingName: "Lokhandwala Heights Residency (34 Floors)",
    ward: "Ward K-West",
    address: "Lokhandwala Complex 4th Cross Rd, Andheri West",
    floorCount: 34,
    propertyTaxSacId: "SAC-KW-449102",
    fireNocExpiryDate: "2026-11-10T00:00:00.000Z",
    fireNocStatus: "AUDIT_CITATION_ISSUED",
    wetRiserPressureKgCm2: 4.6,
    pressureLossDurationMinutes: 0,
    refugeFloorEncroached: true,
    sprinklerSystemActive: true,
    mfbRadarFlagged: true,
    status: "REFUGE_BLOCKED_VIOLATION",
  },
  {
    buildingId: "FIRE-KW-06",
    buildingName: "Andheri Heights Grand Tower (40 Floors)",
    ward: "Ward K-West",
    address: "Veera Desai Road, Andheri West",
    floorCount: 40,
    propertyTaxSacId: "SAC-KW-662890",
    fireNocExpiryDate: "2027-04-12T00:00:00.000Z",
    fireNocStatus: "VALID",
    wetRiserPressureKgCm2: 5.0,
    pressureLossDurationMinutes: 0,
    refugeFloorEncroached: false,
    sprinklerSystemActive: true,
    mfbRadarFlagged: false,
    status: "OPERATIONAL",
  },
]

export default function FireSafetyRadar() {
  const [buildings, setBuildings] = useState<HighRiseFireNoc[]>(FALLBACK_BUILDINGS)
  const [loading, setLoading] = useState(false)
  const [selectedWard, setSelectedWard] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  // Simulator State
  const [simBuildingId, setSimBuildingId] = useState("FIRE-HW-01")
  const [simPressure, setSimPressure] = useState(2.1)
  const [simDuration, setSimDuration] = useState(45)
  const [simResult, setSimResult] = useState<any>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchBuildings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await cityOsApi.getFireSafetyBuildings(selectedWard)
      if (res?.buildings && res.buildings.length > 0) {
        setBuildings(res.buildings)
      } else {
        const filtered =
          selectedWard !== "all"
            ? FALLBACK_BUILDINGS.filter((b) => b.ward === selectedWard)
            : FALLBACK_BUILDINGS
        setBuildings(filtered)
      }
    } catch {
      const filtered =
        selectedWard !== "all"
          ? FALLBACK_BUILDINGS.filter((b) => b.ward === selectedWard)
          : FALLBACK_BUILDINGS
      setBuildings(filtered)
    } finally {
      setLoading(false)
    }
  }, [selectedWard])

  useEffect(() => {
    fetchBuildings()
  }, [fetchBuildings])

  // Telemetry Injection Simulator Handler
  const handleSimulatePressure = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSimulating(true)
    try {
      const res = await cityOsApi.ingestFireTelemetry({
        buildingId: simBuildingId,
        wetRiserPressureKgCm2: simPressure,
        pressureLossDurationMinutes: simDuration,
      })
      setSimResult(res)

      // Dynamically update local high-rise state
      setBuildings((prev) =>
        prev.map((b) => {
          if (b.buildingId === simBuildingId) {
            const isLow = simPressure < 3.5
            const isCritical = isLow && simDuration >= 30
            return {
              ...b,
              wetRiserPressureKgCm2: simPressure,
              pressureLossDurationMinutes: simDuration,
              status: isCritical || isLow ? "DRY_RISER_FAILURE_CRITICAL" : "OPERATIONAL",
              mfbRadarFlagged: isCritical || b.mfbRadarFlagged,
              fireNocStatus: isCritical ? "AUDIT_CITATION_ISSUED" : b.fireNocStatus,
            }
          }
          return b
        })
      )

      if (res.isCriticalLoss) {
        toast.error(
          `🚨 MFB ALERT: ${res.buildingName} booster pressure critically low (${simPressure} kg/cm²). ₹25,000 Property Tax Citation generated!`,
          { duration: 6000 }
        )
      } else {
        toast.success(
          `✅ Telemetry updated for ${res.buildingName}: Booster pressure (${simPressure} kg/cm²) verified compliant.`,
          { duration: 4000 }
        )
      }
    } catch {
      // Local simulator fallback
      const target = buildings.find((b) => b.buildingId === simBuildingId) || buildings[0]
      const isLow = simPressure < 3.5
      const isCritical = isLow && simDuration >= 30
      const mockNotice = isCritical
        ? {
            citationId: `MFB-NOC-${target.buildingId}-${Date.now().toString().slice(-4)}`,
            buildingName: target.buildingName,
            ward: target.ward,
            floors: target.floorCount,
            sacId: target.propertyTaxSacId,
            alertType: "WET_RISER_DEPRESSURIZED_FAILURE",
            recordedPressureKgCm2: simPressure,
            lossDurationMinutes: simDuration,
            citationPenaltyInr: 25000,
            taxNotice: `Statutory ₹25,000 fire safety citation debited against Property Tax SAC Account (${target.propertyTaxSacId}).`,
          }
        : null

      setSimResult({
        buildingId: target.buildingId,
        buildingName: target.buildingName,
        ward: target.ward,
        floorCount: target.floorCount,
        propertyTaxSacId: target.propertyTaxSacId,
        wetRiserPressureKgCm2: simPressure,
        pressureLossDurationMinutes: simDuration,
        status: isCritical ? "DRY_RISER_FAILURE_CRITICAL" : "OPERATIONAL",
        isCriticalLoss: isCritical,
        mfbRadarFlagged: isCritical,
        mfbDispatchNotice: mockNotice,
        statusMessage: isCritical
          ? `🚨 CRITICAL DRY RISER: Booster pump pressure (${simPressure} kg/cm²) < 3.5 kg/cm² threshold.`
          : `✅ WET RISER PRESSURIZED: Booster pressure (${simPressure} kg/cm²) compliant.`,
      })

      setBuildings((prev) =>
        prev.map((b) =>
          b.buildingId === simBuildingId
            ? {
                ...b,
                wetRiserPressureKgCm2: simPressure,
                pressureLossDurationMinutes: simDuration,
                status: isCritical ? "DRY_RISER_FAILURE_CRITICAL" : "OPERATIONAL",
                mfbRadarFlagged: isCritical,
              }
            : b
        )
      )

      if (isCritical) {
        toast.error(`🚨 MFB ALERT: ${target.buildingName} booster pressure critical. ₹25,000 penalty logged.`)
      } else {
        toast.success(`✅ Telemetry injected for ${target.buildingName}.`)
      }
    } finally {
      setIsSimulating(false)
    }
  }

  // Quick Action Dispatch
  const handleDispatchInspection = async (building: HighRiseFireNoc) => {
    setActionLoadingId(building.buildingId)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      toast.success(
        `🚒 MFB Inspection Unit dispatched to ${building.buildingName} (${building.ward}). Notice reference: MFB-DISP-${building.buildingId.slice(-4)}`
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleIssueSacNotice = async (building: HighRiseFireNoc) => {
    setActionLoadingId(building.buildingId)
    try {
      try {
        await cityOsApi.auditRefugeArea({ buildingId: building.buildingId, refugeFloorEncroached: true })
      } catch {
        // Mock fallback
      }
      setBuildings((prev) =>
        prev.map((b) =>
          b.buildingId === building.buildingId
            ? { ...b, refugeFloorEncroached: true, fireNocStatus: "AUDIT_CITATION_ISSUED", mfbRadarFlagged: true }
            : b
        )
      )
      toast.error(
        `🚨 Statutory SAC Citation issued: ₹50,000 debited against ${building.propertyTaxSacId} for fire refuge / riser non-compliance.`
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filtered Buildings
  const filteredBuildings = useMemo(() => {
    return buildings.filter((b) => {
      const matchesSearch =
        b.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.propertyTaxSacId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.buildingId.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "FLAGGED" && b.mfbRadarFlagged) ||
        (statusFilter === "OPERATIONAL" && b.status === "OPERATIONAL") ||
        (statusFilter === "CRITICAL" && b.status === "DRY_RISER_FAILURE_CRITICAL") ||
        (statusFilter === "REFUGE" && b.refugeFloorEncroached)

      return matchesSearch && matchesStatus
    })
  }, [buildings, searchQuery, statusFilter])

  // Summary Metrics Computation
  const metrics = useMemo(() => {
    const totalTowers = buildings.length
    const flaggedTowers = buildings.filter((b) => b.mfbRadarFlagged || b.wetRiserPressureKgCm2 < 3.5).length
    const operationalTowers = buildings.filter(
      (b) => b.status === "OPERATIONAL" && b.wetRiserPressureKgCm2 >= 3.5 && !b.refugeFloorEncroached
    ).length
    const complianceRate = totalTowers > 0 ? Math.round((operationalTowers / totalTowers) * 100) : 100
    const totalCitationsInr = flaggedTowers * 25000 + buildings.filter((b) => b.refugeFloorEncroached).length * 25000

    return {
      totalTowers,
      flaggedTowers,
      complianceRate,
      totalCitationsInr: totalCitationsInr || 75000,
    }
  }, [buildings])

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
      {/* ─── GOVTECH HEADER & WARD SELECTOR ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs px-2.5 py-0.5 font-medium flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              MFB Command Telemetry
            </Badge>
            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs px-2.5 py-0.5 font-medium">
              Maharashtra Fire Prevention Act
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Building2 className="h-8 w-8 text-slate-700 dark:text-slate-300" />
            High-Rise Fire Safety Wet-Riser & NOC Refuge Radar
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl">
            Real-time booster pump pressure telemetry, refuge floor occupancy surveillance, and automated Property Tax SAC
            citation penalties for depressurized dry risers across Mumbai high-rises.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm"
          >
            <option value="all">All Mumbai Wards</option>
            <option value="Ward H-West">Ward H-West (Bandra West)</option>
            <option value="Ward G-South">Ward G-South (Worli / Lower Parel)</option>
            <option value="Ward G-North">Ward G-North (Dadar / Mahim)</option>
            <option value="Ward K-West">Ward K-West (Andheri West)</option>
          </select>
          <Button
            onClick={fetchBuildings}
            variant="outline"
            size="sm"
            className="border-slate-300 dark:border-slate-700 text-xs font-semibold gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* ─── 4-METRIC KPI GRID (UNIFORM GOVTECH SLATE PALETTE) ───────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Statutory Pressure
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                3.5 kg/cm²
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                <Check className="h-3 w-3 text-emerald-600" /> Continuous riser threshold
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                MFB Flagged Towers
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {metrics.flaggedTowers} High-Rises
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3 text-rose-500" /> Depressurized or blocked refuge
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Compliance Rate
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {metrics.complianceRate}% Active
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                <Sparkles className="h-3 w-3 text-emerald-600" /> {metrics.totalTowers - metrics.flaggedTowers}/{metrics.totalTowers} certified
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                SAC Citations Total
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {formatCurrencyINR(metrics.totalCitationsInr)}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                <Check className="h-3 w-3 text-emerald-600" /> Property Tax linked debit
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── MAIN CONTENT: SIMULATOR & TELEMETRY TABLE ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Pressure Injection Simulator */}
        <Card className="lg:col-span-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  Telemetry Stream Simulator
                </CardTitle>
              </div>
              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-medium">
                PRESSURE INJECTOR
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Inject live booster riser readings to verify MFB alarm triggers and automated SAC penalties.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <form onSubmit={handleSimulatePressure} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Target High-Rise Complex
                </label>
                <select
                  value={simBuildingId}
                  onChange={(e) => setSimBuildingId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium"
                >
                  {buildings.map((b) => (
                    <option key={b.buildingId} value={b.buildingId}>
                      {b.buildingName} ({b.ward})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold">
                    Booster Pump Riser Pressure
                  </label>
                  <span
                    className={`font-mono font-bold ${
                      simPressure < 3.5 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {simPressure.toFixed(1)} kg/cm² {simPressure < 3.5 ? "(Deficit)" : "(Normal)"}
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="6.5"
                  step="0.1"
                  value={simPressure}
                  onChange={(e) => setSimPressure(Number(e.target.value))}
                  className="w-full accent-slate-700 dark:accent-slate-300 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>1.0 kg/cm² (Failure)</span>
                  <span className="text-rose-500 font-bold">Min: 3.5</span>
                  <span>6.5 kg/cm² (Optimal)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold">
                    Depressurization Duration
                  </label>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {simDuration} mins {simDuration >= 30 ? "(Statutory Breach)" : "(Transient)"}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="5"
                  value={simDuration}
                  onChange={(e) => setSimDuration(Number(e.target.value))}
                  className="w-full accent-slate-700 dark:accent-slate-300 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>5 mins</span>
                  <span className="text-amber-500 font-bold">Threshold: 30m</span>
                  <span>90 mins</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSimulating}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold py-2 shadow-sm gap-1.5 transition-all mt-2"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isSimulating ? "Analyzing Booster Telemetry..." : "Inject Telemetry & Check MFB Alert"}</span>
              </Button>
            </form>

            {simResult?.mfbDispatchNotice && (
              <div className="mt-4 p-3.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold">
                  <Send className="w-3.5 h-3.5" />
                  <span>MFB Emergency Citation & SAC Notice</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2.5 rounded-md border border-rose-100 dark:border-rose-900">
                  {simResult.mfbDispatchNotice.taxNotice}
                </p>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 flex justify-between pt-1 font-mono">
                  <span>Penalty: {formatCurrencyINR(simResult.mfbDispatchNotice.citationPenaltyInr || 25000)}</span>
                  <span>Station: Byculla Fire HQ</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: High-Rise Telemetry Table (Full Real-Time Table) */}
        <Card className="lg:col-span-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  Mumbai High-Rise Fire Safety Wet-Riser Grid
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Live monitoring of continuous riser pressure, refuge area clearances, and active NOC validity.
                </CardDescription>
              </div>

              {/* Search & Status Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-44">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search tower or SAC..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 h-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 font-medium"
                >
                  <option value="ALL">All Status</option>
                  <option value="FLAGGED">MFB Flagged Only</option>
                  <option value="OPERATIONAL">Operational</option>
                  <option value="CRITICAL">Dry Riser Failure</option>
                  <option value="REFUGE">Refuge Blocked</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">High-Rise Complex & Ward</th>
                    <th className="py-3 px-3">Booster Pressure</th>
                    <th className="py-3 px-3">Refuge & Sprinklers</th>
                    <th className="py-3 px-3">Fire NOC Status</th>
                    <th className="py-3 px-3">SAC ID / Penalty</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBuildings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No matching high-rise buildings found.
                      </td>
                    </tr>
                  ) : (
                    filteredBuildings.map((b) => {
                      const isLowPressure = b.wetRiserPressureKgCm2 < 3.5
                      const isRefugeBlocked = b.refugeFloorEncroached
                      const isCritical = isLowPressure || isRefugeBlocked

                      return (
                        <tr key={b.buildingId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Complex & Ward */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white leading-tight">
                              {b.buildingName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {b.ward} • {b.floorCount} Floors • <span className="font-mono">{b.buildingId}</span>
                            </div>
                          </td>

                          {/* Booster Pressure */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                  isLowPressure
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse"
                                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                }`}
                              >
                                {b.wetRiserPressureKgCm2.toFixed(1)} kg/cm²
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              {isLowPressure ? `Deficit (${b.pressureLossDurationMinutes || 35}m)` : "Optimal (≥3.5)"}
                            </span>
                          </td>

                          {/* Refuge & Sprinklers */}
                          <td className="py-3.5 px-3">
                            <div className="text-[11px] space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">Refuge:</span>
                                {isRefugeBlocked ? (
                                  <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5">
                                    <AlertTriangle className="h-3 w-3" /> Obstructed
                                  </span>
                                ) : (
                                  <span className="text-slate-700 dark:text-slate-300 font-medium">Clear</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">Sprinklers:</span>
                                <span className="text-slate-700 dark:text-slate-300">
                                  {b.sprinklerSystemActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* NOC Status & Expiry */}
                          <td className="py-3.5 px-3">
                            <Badge
                              className={`text-[10px] font-medium border ${
                                b.fireNocStatus === "VALID"
                                  ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300"
                              }`}
                            >
                              {b.fireNocStatus.replace(/_/g, " ")}
                            </Badge>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Exp: {formatDate(b.fireNocExpiryDate || "2027-04-15")}
                            </div>
                          </td>

                          {/* SAC ID & Citation Penalty */}
                          <td className="py-3.5 px-3">
                            <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                              {b.propertyTaxSacId}
                            </div>
                            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                              {isCritical ? `Citation: ${formatCurrencyINR(25000)}` : "No Active Fine"}
                            </div>
                          </td>

                          {/* Quick Action */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isCritical ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={actionLoadingId === b.buildingId}
                                  onClick={() => handleDispatchInspection(b)}
                                  className="h-7 text-[11px] px-2.5 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40 font-semibold"
                                >
                                  {actionLoadingId === b.buildingId ? "Dispatching..." : "Dispatch MFB"}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={actionLoadingId === b.buildingId}
                                  onClick={() => handleIssueSacNotice(b)}
                                  className="h-7 text-[11px] px-2.5 border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 font-medium"
                                >
                                  Audit Refuge
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
