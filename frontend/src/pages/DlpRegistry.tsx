import { useState, useEffect, useCallback } from "react"
import {
  Calculator,
  Lock,
  RefreshCw,
  Building2,
  Wrench,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  TrendingDown,
  X,
  Sparkles,
  Layers,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { municipalApi, type RoadContract } from "@/services/municipalApi"
import { formatCurrencyINR, formatDate } from "@/utils/formatters"
import toast from "react-hot-toast"

export default function DlpRegistry() {
  const [contracts, setContracts] = useState<RoadContract[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Pothole Sizer State
  const [lengthCm, setLengthCm] = useState(90)
  const [widthCm, setWidthCm] = useState(70)
  const [depthCm, setDepthCm] = useState(10)
  const [surfaceType, setSurfaceType] = useState("MASTIC_ASPHALT")
  const [sizerResult, setSizerResult] = useState<any>(null)
  const [selectedContract, setSelectedContract] = useState<RoadContract | null>(null)

  // Freeze Retention Confirmation Modal
  const [freezeModalContract, setFreezeModalContract] = useState<RoadContract | null>(null)
  const [isFreezing, setIsFreezing] = useState(false)

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await municipalApi.getRoadContracts()
      const list = res.contracts || []
      setContracts(list)
      if (list.length > 0 && !selectedContract) {
        setSelectedContract(list[0])
      }
    } catch {
      toast.error("Failed to load road contracts")
    } finally {
      setLoading(false)
    }
  }, [selectedContract])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  // Run pothole volumetric calculation
  const calculateVolumeAndCosts = useCallback(async () => {
    try {
      const res = await municipalApi.estimatePotholeVolume({
        lengthCm,
        widthCm,
        depthCm,
        surfaceType,
      })

      const est = res.estimation || {
        surfaceAreaSqMeters: ((lengthCm * widthCm) / 10000).toFixed(2),
        volumeCubicMeters: ((lengthCm * widthCm * depthCm) / 1000000).toFixed(3),
        requiredAsphaltTonnes: (((lengthCm * widthCm * depthCm) / 1000000) * 2.4).toFixed(3),
        coldMixBagsRequired: Math.ceil((((lengthCm * widthCm * depthCm) / 1000000) * 2400) / 25),
        estimatedLaborMinutes: Math.max(30, Math.round(depthCm * 4)),
        severityRating: depthCm > 8 ? "CRITICAL_DEPTH" : depthCm > 4 ? "MODERATE_CAVITY" : "SURFACE_SHALLOW",
      }

      // BMC Schedule of Rates (SOR 2026): ₹3,500/tonne + labor overheads
      const asphaltTonnes = parseFloat(est.requiredAsphaltTonnes) || 0.15
      const ratePerTonne = surfaceType === "MASTIC_ASPHALT" ? 3800 : surfaceType === "ASPHALT_MACADAM" ? 3200 : 2800
      const estimatedCostInr = Math.max(1250, Math.round(asphaltTonnes * ratePerTonne + (est.estimatedLaborMinutes || 30) * 25))

      setSizerResult({
        ...est,
        estimatedCostInr,
      })
    } catch {
      const vol = (lengthCm * widthCm * depthCm) / 1000000
      const tonnes = vol * 2.4
      const bags = Math.ceil((tonnes * 1000) / 25)
      setSizerResult({
        surfaceAreaSqMeters: ((lengthCm * widthCm) / 10000).toFixed(2),
        volumeCubicMeters: vol.toFixed(3),
        requiredAsphaltTonnes: tonnes.toFixed(3),
        coldMixBagsRequired: bags,
        estimatedLaborMinutes: Math.max(30, depthCm * 4),
        severityRating: depthCm > 8 ? "CRITICAL_DEPTH" : depthCm > 4 ? "MODERATE_CAVITY" : "SURFACE_SHALLOW",
        estimatedCostInr: Math.max(1250, Math.round(tonnes * 3500 + 450)),
      })
    }
  }, [lengthCm, widthCm, depthCm, surfaceType])

  useEffect(() => {
    calculateVolumeAndCosts()
  }, [calculateVolumeAndCosts])

  const handleCalculatePothole = (e: React.FormEvent) => {
    e.preventDefault()
    calculateVolumeAndCosts()
    toast.success("3D Volumetric Defect & Financial Liability Calculated!")
  }

  const confirmFreezeRetention = async () => {
    if (!freezeModalContract) return
    setIsFreezing(true)
    try {
      await municipalApi.freezeDlpRetention(
        freezeModalContract.contractId,
        "Repeated road subsidence during active 36-month DLP warranty period under MMC Act Section 354"
      )
      toast.success(
        `Retention Deposit (₹${(freezeModalContract.retentionFundAmountInr / 100000).toFixed(1)}L) FROZEN for ${freezeModalContract.contractId}!`
      )
      setFreezeModalContract(null)
      fetchContracts()
    } catch {
      toast.error("Could not freeze retention funds")
    } finally {
      setIsFreezing(false)
    }
  }

  const filtered = contracts.filter(
    (c) =>
      c.roadName.toLowerCase().includes(search.toLowerCase()) ||
      c.contractorName.toLowerCase().includes(search.toLowerCase()) ||
      c.ward.toLowerCase().includes(search.toLowerCase())
  )

  // Calculate elapsed months for DLP warranty progress bar
  const getWarrantyProgress = (completionDate: string, expiryDate: string) => {
    try {
      const start = new Date(completionDate).getTime()
      const end = new Date(expiryDate).getTime()
      const now = Date.now()
      const total = end - start
      const elapsed = Math.max(0, Math.min(total, now - start))
      const percentage = Math.round((elapsed / total) * 100)
      const elapsedMonths = Math.min(36, Math.max(0, Math.round(elapsed / (1000 * 3600 * 24 * 30.4))))
      return { percentage, elapsedMonths }
    } catch {
      return { percentage: 50, elapsedMonths: 18 }
    }
  }

  // Severity categorization for visual bar
  const getDepthSeverity = (depth: number) => {
    if (depth >= 8) {
      return {
        label: "Severe Cavity (> 8cm)",
        color: "bg-rose-500 text-rose-500",
        badgeBg: "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400",
        level: "SEVERE",
        percentage: Math.min(100, Math.round((depth / 15) * 100)),
      }
    }
    if (depth >= 5) {
      return {
        label: "Moderate Cavity (5–8cm)",
        color: "bg-amber-500 text-amber-500",
        badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
        level: "MODERATE",
        percentage: Math.min(100, Math.round((depth / 15) * 100)),
      }
    }
    return {
      label: "Shallow Surface Defect (< 5cm)",
      color: "bg-emerald-500 text-emerald-500",
      badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
      level: "SHALLOW",
      percentage: Math.min(100, Math.round((depth / 15) * 100)),
    }
  }

  const depthSeverity = getDepthSeverity(depthCm)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-zinc-900/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 backdrop-blur-md shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-display">
              Defect Liability Period (DLP) Road Registry & 3D Volumetric Sizer
            </h1>
            <Badge className="bg-emerald-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full">
              MMC ACT SEC 354
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-sans">
            AI-driven road cavity volume estimation, automated contractor escrow liability routing, and statutory warranty retention tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchContracts}
            variant="outline"
            size="sm"
            className="border-zinc-200 dark:border-zinc-800 text-xs font-medium gap-1.5 rounded-xl h-9 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </Button>
        </div>
      </div>

      {/* Main Dual-Column Grid: 3D Volumetric Sizer & Financial Liability Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Form: Dimension Inputs & 3D Visualizer (5 Cols) */}
        <Card className="lg:col-span-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-lg space-y-4">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-sm font-bold font-display text-slate-900 dark:text-white">
                3D Pothole Volumetric & Asphalt Sizer
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
              AI ESTIMATOR
            </span>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            {/* Interactive Selected Road Banner */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/70 dark:border-zinc-700/60 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-zinc-400 font-semibold">Active Mapped Corridor:</span>
                <Badge variant="outline" className="font-mono text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300">
                  {selectedContract ? selectedContract.contractId : "General Road Estimate"}
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
                {selectedContract ? selectedContract.roadName : "Select a road from registry below"}
              </p>
              {selectedContract && (
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Contractor: <strong className="text-slate-700 dark:text-zinc-300">{selectedContract.contractorName}</strong> ({selectedContract.ward})
                </p>
              )}
            </div>

            <form onSubmit={handleCalculatePothole} className="space-y-3.5 text-xs">
              {/* Dimension Sliders / Inputs */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block text-[11px]">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block text-[11px]">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={widthCm}
                    onChange={(e) => setWidthCm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block text-[11px]">
                    Depth (cm)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={depthCm}
                    onChange={(e) => setDepthCm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Surface Material Selection */}
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400 font-semibold block text-[11px]">
                  Surface Material Specification
                </label>
                <select
                  value={surfaceType}
                  onChange={(e) => setSurfaceType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="MASTIC_ASPHALT">Mastic Asphalt (Density: 2.4 t/m³ • High Traffic)</option>
                  <option value="ASPHALT_MACADAM">Dense Bituminous Macadam (Density: 2.25 t/m³)</option>
                  <option value="COLD_MIX">Cold Mix Emergency Bitumen (Density: 2.2 t/m³)</option>
                </select>
              </div>

              {/* Engineering CAD Wireframe Geometry Model */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-mono font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    CAD CAVITY WIREFRAME
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px] bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                    {lengthCm}cm × {widthCm}cm × {depthCm}cm
                  </span>
                </div>

                {/* Technical Blueprint Grid Canvas */}
                <div
                  className="h-28 w-full rounded-xl border border-slate-300 dark:border-slate-700/80 relative flex items-center justify-center p-3 overflow-hidden bg-slate-100/70 dark:bg-slate-950/60"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(148, 163, 184, 0.2) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(148, 163, 184, 0.2) 1px, transparent 1px)
                    `,
                    backgroundSize: "14px 14px",
                  }}
                >
                  {/* Coordinate Axes Indicator */}
                  <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                    Scale: 1:10 CM
                  </div>

                  {/* Architectural Drafting Bounding Box with Dimension Lines */}
                  <div className="relative flex items-center justify-center">
                    {/* Top Dimension Annotation (Length) */}
                    <div className="absolute -top-5 flex items-center gap-1 w-full justify-center text-[10px] font-mono text-blue-700 dark:text-blue-300 font-bold">
                      <span className="text-slate-400">|‹</span>
                      <span>L: {lengthCm} cm</span>
                      <span className="text-slate-400">›|</span>
                    </div>

                    {/* CAD Wireframe Box */}
                    <div
                      className="border-2 border-blue-600 dark:border-blue-400 bg-blue-500/10 dark:bg-blue-500/20 rounded-md flex items-center justify-center transition-all duration-300 relative shadow-sm"
                      style={{
                        width: `${Math.min(180, Math.max(60, (lengthCm / 200) * 160))}px`,
                        height: `${Math.min(65, Math.max(28, (widthCm / 150) * 55))}px`,
                      }}
                    >
                      {/* Depth Badge */}
                      <span className="text-[10px] font-mono font-bold text-blue-900 dark:text-blue-100 bg-white/90 dark:bg-slate-900/90 border border-blue-300 dark:border-blue-700 px-1.5 py-0.5 rounded shadow-xs">
                        D: {depthCm} cm
                      </span>

                      {/* Right Dimension Annotation (Width) */}
                      <div className="absolute -right-16 flex items-center gap-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                        <span>W: {widthCm}cm</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Engineering Segmented Depth Gauge */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-600 dark:text-slate-400">Severity Zone:</span>
                    <span className={`font-bold ${depthSeverity.color}`}>{depthSeverity.label}</span>
                  </div>
                  {/* 3-Segment Progress Gauge */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="space-y-1">
                      <div
                        className={`h-2 rounded-full transition-colors ${
                          depthCm > 0 ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      />
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 block text-center">
                        &lt; 5cm (Shallow)
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div
                        className={`h-2 rounded-full transition-colors ${
                          depthCm >= 5 ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      />
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 block text-center">
                        5–8cm (Moderate)
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div
                        className={`h-2 rounded-full transition-colors ${
                          depthCm >= 8 ? "bg-rose-500" : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      />
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 block text-center">
                        &gt; 8cm (Severe)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold py-2.5 shadow-md gap-1.5 transition-all active:scale-[0.99]"
              >
                <Calculator className="w-4 h-4" />
                <span>Calculate Required Asphalt & Financial Liability</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Card: Volumetric Output & Statutory Escrow Breakdown (7 Cols) */}
        <Card className="lg:col-span-7 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold font-display uppercase tracking-wider text-slate-900 dark:text-white">
                  Volumetric Repair & Statutory Liability Breakdown
                </h3>
              </div>
              <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono text-[10px]">
                SOR 2026 SPEC
              </Badge>
            </div>

            {sizerResult ? (
              <div className="space-y-4 pt-3">
                {/* 4-Cell Volumetric Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-50 dark:bg-zinc-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-700/60">
                    <span className="text-[10px] text-slate-400 font-mono">Surface Area</span>
                    <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                      {sizerResult.surfaceAreaSqMeters} m²
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-zinc-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-700/60">
                    <span className="text-[10px] text-slate-400 font-mono">Cavity Volume</span>
                    <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                      {sizerResult.volumeCubicMeters} m³
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-zinc-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-700/60">
                    <span className="text-[10px] text-slate-400 font-mono">Required Asphalt</span>
                    <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {sizerResult.requiredAsphaltTonnes} Tonnes
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-zinc-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-700/60">
                    <span className="text-[10px] text-slate-400 font-mono">Cold-Mix Bags</span>
                    <p className="text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                      {sizerResult.coldMixBagsRequired} Bags (25kg)
                    </p>
                  </div>
                </div>

                {/* Financial Liability Routing Engine */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        Estimated Defect Rectification Cost
                      </span>
                      <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                        {formatCurrencyINR(sizerResult.estimatedCostInr || 2850)}
                      </p>
                    </div>

                    {/* Liability Tag: DLP Auto-Debit vs Municipal Fund */}
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">
                        Statutory Liability Routing
                      </span>
                      {selectedContract && !selectedContract.retentionFundFrozen ? (
                        <Badge className="bg-rose-600 text-white font-mono text-xs px-2.5 py-1 rounded-lg gap-1 shadow-sm mt-0.5">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>AUTO-DEBIT CONTRACTOR ESCROW</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-600 text-white font-mono text-xs px-2.5 py-1 rounded-lg gap-1 shadow-sm mt-0.5">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>BMC MAINTENANCE FUND</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Contractor Escrow Deductibility Banner */}
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-700/80 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-800 dark:text-zinc-200 font-semibold">
                      <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Contractor: <strong>{selectedContract?.contractorName || "Assigned Ward Contractor"}</strong>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Under <strong>MMC Act Section 354</strong>, this road is within its active 36-month warranty. The repair amount ({formatCurrencyINR(sizerResult.estimatedCostInr || 2850)}) will be automatically billed against the contractor's retention bank guarantee with ₹0 cost to the municipal exchequer.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Wrench className="w-10 h-10 opacity-30 mb-2" />
                <p className="text-xs">Adjust dimensions and click calculate to view volumetric output and escrow breakdown</p>
              </div>
            )}
          </div>

          {sizerResult && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Estimated Field Crew Work Time: <strong>{sizerResult.estimatedLaborMinutes} mins</strong>
              </span>
              <Badge className="bg-emerald-600 text-white text-[10px] self-start sm:self-auto font-mono">
                {depthSeverity.level} DEFECT
              </Badge>
            </div>
          )}
        </Card>
      </div>

      {/* Active Road Contractor Warranty Registry */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Active Municipal Road Defect Liability Warranties (36 Months)
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Live contractor retention bank guarantees linked with automated penalty deduction triggers.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search road, ward or contractor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl shadow-md overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/60">
          {filtered.map((c) => {
            const isLocked = c.retentionFundFrozen || c.status === "PENALTY_LOCKED"
            const isSelected = selectedContract?.contractId === c.contractId
            const warranty = getWarrantyProgress(c.completionDate, c.dlpExpiryDate)

            return (
              <div
                key={c._id || c.contractId}
                className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                  isSelected
                    ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-l-4 border-l-emerald-600"
                    : "hover:bg-slate-50/50 dark:hover:bg-zinc-800/40"
                }`}
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-400">{c.contractId}</span>
                    <Badge
                      className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        isLocked
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {isLocked ? "RETENTION DEPOSIT FROZEN" : "ACTIVE 36M WARRANTY"}
                    </Badge>
                    <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md font-semibold">
                      {c.activeDefectCount || 0} Active Defects
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white font-display truncate">
                    {c.roadName}
                  </h3>

                  <div className="flex items-center gap-2 sm:gap-4 text-xs text-slate-500 dark:text-zinc-400 font-mono flex-wrap">
                    <span>{c.ward}</span>
                    <span>•</span>
                    <span>Contractor: <strong className="text-slate-800 dark:text-zinc-200">{c.contractorName}</strong></span>
                    <span>•</span>
                    <span>{c.surfaceType}</span>
                  </div>

                  {/* Warranty Lifespan Progress Bar */}
                  <div className="space-y-1 max-w-md pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                      <span>Warranty Lifespan: <strong>{warranty.elapsedMonths} / 36 Months Elapsed</strong></span>
                      <span>Expires {formatDate(c.dlpExpiryDate)}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${warranty.percentage}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 pt-0.5">
                    Retention Guarantee Deposit: <strong className="text-slate-700 dark:text-zinc-300">₹{(c.retentionFundAmountInr / 100000).toFixed(1)} Lakhs</strong> (Bank BG)
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-auto">
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => {
                      setSelectedContract(c)
                      toast.success(`Linked Sizer to ${c.roadName}`)
                    }}
                    className={`text-xs font-semibold h-9 rounded-xl gap-1.5 ${
                      isSelected
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-slate-200 dark:border-zinc-700"
                    }`}
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>{isSelected ? "Linked for Sizer" : "Select for Sizer"}</span>
                  </Button>

                  {isLocked ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="border-rose-300 text-rose-600 text-xs font-semibold h-9 rounded-xl gap-1.5 opacity-80"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>₹{(c.retentionFundAmountInr / 100000).toFixed(1)}L Frozen</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setFreezeModalContract(c)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-9 rounded-xl gap-1.5 shadow-sm"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Freeze Retention</span>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Freeze Retention Statutory Confirmation Modal */}
      {freezeModalContract && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="freeze-dialog-title"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-zinc-900 max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-4 p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="freeze-dialog-title" className="text-sm font-bold text-slate-900 dark:text-white">
                    Statutory Warranty Freeze Order
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    MMC Act Section 354 Statutory Debarment Action
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFreezeModalContract(null)}
                aria-label="Close Dialog"
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2 text-xs text-rose-950 dark:text-rose-200">
              <p className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                <Lock className="w-4 h-4" />
                Confirming Immediate Retention Fund Freeze:
              </p>
              <ul className="space-y-1 list-disc list-inside text-[11px] text-rose-900 dark:text-rose-300">
                <li>Contractor: <strong>{freezeModalContract.contractorName}</strong></li>
                <li>Road Corridor: <strong>{freezeModalContract.roadName}</strong></li>
                <li>Frozen Bank BG Deposit: <strong>₹{(freezeModalContract.retentionFundAmountInr / 100000).toFixed(1)} Lakhs</strong></li>
                <li>Statutory Section: <strong>MMC Act Section 354 & Road Defect Liability Rules</strong></li>
              </ul>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Executing this order will immediately lock the contractor's bank guarantee deposit, block DLP release clearance, and record an immutable SHA-256 block hash in the municipal audit ledger.
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFreezeModalContract(null)}
                disabled={isFreezing}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={confirmFreezeRetention}
                disabled={isFreezing}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-1.5 shadow-md"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isFreezing ? "Freezing Funds..." : "Execute Statutory Freeze"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
