import { useState, useEffect, useCallback } from "react"
import {
  Building2,
  RefreshCw,
  Calculator,
  Plus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cityOsApi, type PropertyTaxDiscrepancy } from "@/services/cityOsApi"
import toast from "react-hot-toast"

export default function PropertyTaxAudit() {
  const [properties, setProperties] = useState<PropertyTaxDiscrepancy[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState("all")

  // Reconciliation Calculator State
  const [sacNo, setSacNo] = useState("SAC-HW-99104")
  const [declaredArea, setDeclaredArea] = useState(1800)
  const [lidarArea, setLidarArea] = useState(2750)
  const [permittedUse, setPermittedUse] = useState("RESIDENTIAL")
  const [detectedUse, setDetectedUse] = useState("COMMERCIAL_UNAUTHORIZED")
  const [hasRooftop, setHasRooftop] = useState(true)
  const [calcResult, setCalcResult] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true)
      const res = await cityOsApi.getTaxDiscrepancies(selectedWard)
      setProperties(res.properties)
    } catch {
      toast.error("Failed to load property tax discrepancies")
    } finally {
      setLoading(false)
    }
  }, [selectedWard])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCalculating(true)
    try {
      const res = await cityOsApi.reconcilePropertyTax({
        propertySacNo: sacNo,
        assessedCarpetAreaSqFt: declaredArea,
        lidarMeasuredAreaSqFt: lidarArea,
        permittedLandUse: permittedUse,
        detectedActualUse: detectedUse,
        hasRooftopExtension: hasRooftop,
      })
      setCalcResult(res)
      if (res.isViolation) {
        toast.error(res.assessmentNotice, { icon: "🚨", duration: 7000 })
      } else {
        toast.success(res.assessmentNotice, { duration: 5000 })
      }
      fetchProperties()
    } catch {
      toast.error("Tax reconciliation calculation failed")
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              LiDAR & Drone 3D Property Tax Assessment
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              GIS REVENUE RECOVERY
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Automated detection of undeclared commercial carpet area, unauthorized rooftop extensions, and penalty assessment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-2 rounded-md bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs font-medium"
          >
            <option value="all">All Mumbai Wards</option>
            <option value="Ward H-West">Ward H-West (Bandra / Khar)</option>
            <option value="Ward K-West">Ward K-West (Andheri / Juhu)</option>
            <option value="Ward D">Ward D (Malabar Hill)</option>
          </select>

          <Button
            onClick={fetchProperties}
            variant="outline"
            size="sm"
            className="border-zinc-200 dark:border-zinc-800 text-xs font-medium gap-1.5 rounded-md h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Ledger</span>
          </Button>
        </div>
      </div>

      {/* Top 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Recoverable Revenue Demand
          </span>
          <div className="text-2xl font-bold font-mono text-violet-600 dark:text-violet-400 mt-2">
            ₹13.4 Lakhs
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Tax deficit + 200% statutory penalty</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Undeclared Area Flags
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
            {properties.filter((p) => p.discrepancyPercentage > 15).length} Properties
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">&gt;15% physical envelope expansion</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Unauthorized Commercial Uses
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
            {properties.filter((p) => p.detectedActualUse === "COMMERCIAL_UNAUTHORIZED").length} Units
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Commercial rate revision enforced</p>
        </div>
      </div>

      {/* Reconcile Calculator & Properties List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Calculator */}
        <Card className="lg:col-span-5 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-violet-600" />
              <CardTitle className="text-sm font-bold font-display text-slate-900 dark:text-white">
                3D LiDAR Area Reconciliation
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-violet-600 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
              AI AUDITOR
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleReconcile} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Property SAC Number
                </label>
                <input
                  type="text"
                  value={sacNo}
                  onChange={(e) => setSacNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Declared Area (Sq Ft)
                  </label>
                  <input
                    type="number"
                    value={declaredArea}
                    onChange={(e) => setDeclaredArea(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    LiDAR Mesh (Sq Ft)
                  </label>
                  <input
                    type="number"
                    value={lidarArea}
                    onChange={(e) => setLidarArea(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Permitted Land Use
                  </label>
                  <select
                    value={permittedUse}
                    onChange={(e) => setPermittedUse(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="RESIDENTIAL">Residential (₹120/sqft)</option>
                    <option value="COMMERCIAL_AUTHORIZED">Commercial Authorized</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Detected Actual Use
                  </label>
                  <select
                    value={detectedUse}
                    onChange={(e) => setDetectedUse(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="COMMERCIAL_UNAUTHORIZED">Commercial Unauthorized</option>
                    <option value="RESIDENTIAL">Residential</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Rooftop / Balcony Extension Detected
                </span>
                <input
                  type="checkbox"
                  checked={hasRooftop}
                  onChange={(e) => setHasRooftop(e.target.checked)}
                  className="w-4 h-4 accent-violet-600 cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                disabled={isCalculating}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold py-2 shadow-sm gap-1.5 transition-all mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCalculating ? "Calculating Deficit..." : "Reconcile Tax & Generate Notice"}</span>
              </Button>
            </form>

            {calcResult && (
              <div className="mt-4 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-mono font-bold text-violet-900 dark:text-violet-300">
                  <span>Demand Notice: ₹{calcResult.totalRecoveryInr?.toLocaleString()}</span>
                  <Badge className="bg-violet-600 text-white text-[10px]">+{calcResult.discrepancyPercentage}% AREA</Badge>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300">
                  Deficit: <strong>₹{calcResult.estimatedTaxDeficitInr?.toLocaleString()}</strong> + 200% Penalty: <strong>₹{calcResult.penaltyAmountInr?.toLocaleString()}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Properties Discrepancy List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-600" />
              Audited 3D Envelope Discrepancies
            </h2>
            <span className="text-xs font-mono text-slate-400">LiDAR 3D Mesh</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {properties.map((p) => {
              const isFlagged = p.status === "REVENUE_LEAKAGE_FLAGGED" || p.status === "DEMAND_NOTICE_SERVED"
              return (
                <div key={p.propertySacNo} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{p.propertySacNo}</span>
                      <Badge
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          isFlagged
                            ? "bg-rose-600 text-white animate-pulse"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {p.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                      {p.ownerName}
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      {p.ward} • {p.address} • Land Use: <strong>{p.detectedActualUse}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Declared: {p.assessedCarpetAreaSqFt} sq ft • Physical: {p.lidarMeasuredAreaSqFt} sq ft (+{p.discrepancyPercentage}%)
                    </p>
                  </div>

                  <div className="text-right shrink-0 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-mono block">Tax Recovery Demand</span>
                    <span className={`text-base font-mono font-bold ${p.estimatedTaxDeficitInr > 0 ? "text-violet-600" : "text-slate-800 dark:text-slate-200"}`}>
                      ₹{(p.estimatedTaxDeficitInr / 100000).toFixed(1)}L
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">+200% Penalty</span>
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
