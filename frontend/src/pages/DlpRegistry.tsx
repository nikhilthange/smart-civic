import { useState, useEffect, useCallback } from "react"
import {
  Calculator,
  Lock,
  RefreshCw,
  Building2,
  Wrench,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { municipalApi, type RoadContract } from "@/services/municipalApi"
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

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await municipalApi.getRoadContracts()
      if (res.contracts.length > 0) {
        setContracts(res.contracts)
      } else {
        // Fallback demo contracts
        setContracts([
          {
            _id: "1",
            contractId: "DLP-2024-RD-109",
            roadName: "Linking Road (Khar to Bandra Station)",
            ward: "Ward H-West",
            contractorName: "RPS Infraprojects Ltd",
            surfaceType: "MASTIC_ASPHALT",
            completionDate: "2024-04-15",
            dlpExpiryDate: "2027-04-15",
            totalProjectCostInr: 45000000,
            retentionFundAmountInr: 4500000,
            retentionFundFrozen: false,
            activeDefectCount: 2,
            status: "ACTIVE_WARRANTY",
          },
          {
            _id: "2",
            contractId: "DLP-2023-RD-884",
            roadName: "S.V. Road Junction (Andheri West)",
            ward: "Ward K-West",
            contractorName: "J. Kumar Infraprojects",
            surfaceType: "CEMENT_CONCRETE",
            completionDate: "2023-11-20",
            dlpExpiryDate: "2026-11-20",
            totalProjectCostInr: 68000000,
            retentionFundAmountInr: 6800000,
            retentionFundFrozen: true,
            activeDefectCount: 4,
            status: "PENALTY_LOCKED",
          },
          {
            _id: "3",
            contractId: "DLP-2025-RD-204",
            roadName: "Dr. B.A. Road Corridor (Dadar to Parel)",
            ward: "Ward F-South",
            contractorName: "Eagle Infra India Ltd",
            surfaceType: "MASTIC_ASPHALT",
            completionDate: "2025-01-10",
            dlpExpiryDate: "2028-01-10",
            totalProjectCostInr: 52000000,
            retentionFundAmountInr: 5200000,
            retentionFundFrozen: false,
            activeDefectCount: 0,
            status: "ACTIVE_WARRANTY",
          },
        ])
      }
    } catch {
      toast.error("Failed to load road contracts")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  // Run pothole sizer
  const handleCalculatePothole = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await municipalApi.estimatePotholeVolume({
        lengthCm,
        widthCm,
        depthCm,
        surfaceType,
      })
      setSizerResult(res.estimation)
      toast.success("3D Volumetric Defect Calculated!")
    } catch {
      toast.error("Failed to calculate pothole volume")
    }
  }

  const handleFreezeRetention = async (contractId: string) => {
    try {
      await municipalApi.freezeDlpRetention(contractId, "Defects reported within 36-month warranty period")
      toast.success(`Retention deposit for ${contractId} has been FROZEN!`)
      fetchContracts()
    } catch {
      toast.error("Could not freeze retention funds")
    }
  }

  const filtered = contracts.filter(
    (c) =>
      c.roadName.toLowerCase().includes(search.toLowerCase()) ||
      c.contractorName.toLowerCase().includes(search.toLowerCase()) ||
      c.ward.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Defect Liability Period (DLP) Road Registry
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              CONTRACTOR WARRANTY WATCH
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Automated contractor repair enforcement, warranty tracking, and bank guarantee retention fund freeze.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={fetchContracts}
            variant="outline"
            size="sm"
            className="border-zinc-200 dark:border-zinc-800 text-xs font-medium gap-1.5 rounded-md h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Top 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Form: Dimension Inputs */}
        <Card className="lg:col-span-6 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-bold font-display text-slate-900 dark:text-white">
                3D Pothole Volumetric & Asphalt Sizer
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              AI ESTIMATOR
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleCalculatePothole} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                    Depth (cm)
                  </label>
                  <input
                    type="number"
                    value={depthCm}
                    onChange={(e) => setDepthCm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                  Surface Material Type
                </label>
                <select
                  value={surfaceType}
                  onChange={(e) => setSurfaceType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="MASTIC_ASPHALT">Mastic Asphalt (Density: 2.4 t/m³)</option>
                  <option value="ASPHALT_MACADAM">Dense Bituminous Macadam (Density: 2.25 t/m³)</option>
                  <option value="COLD_MIX">Cold Mix Emergency Bitumen (Density: 2.2 t/m³)</option>
                </select>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold py-2 shadow-sm gap-1.5 transition-all"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculate Required Asphalt Tonnage</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Output Card */}
        <Card className="lg:col-span-6 border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold font-mono uppercase text-slate-500 tracking-wider mb-3">
              Volumetric Repair Output
            </h3>
            {sizerResult ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-mono">Surface Area</span>
                  <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {sizerResult.surfaceAreaSqMeters} m²
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-mono">Volume</span>
                  <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {sizerResult.volumeCubicMeters} m³
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-mono">Required Asphalt</span>
                  <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {sizerResult.requiredAsphaltTonnes} Tonnes
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-mono">Cold-Mix Bags (25kg)</span>
                  <p className="text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                    {sizerResult.coldMixBagsRequired} Bags
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Wrench className="w-8 h-8 opacity-30 mb-2" />
                <p className="text-xs">Adjust dimensions and click calculate to estimate asphalt payload</p>
              </div>
            )}
          </div>
          {sizerResult && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
              <span>Estimated Crew Work Time: <strong>{sizerResult.estimatedLaborMinutes} mins</strong></span>
              <Badge className="bg-emerald-600 text-white text-[10px]">{sizerResult.severityRating}</Badge>
            </div>
          )}
        </Card>
      </div>

      {/* Active Road Contractor Warranty Registry */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Active Municipal Road Defect Liability Warranties (36 Months)
          </h2>
          <input
            type="text"
            placeholder="Search road or contractor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
          {filtered.map((c) => {
            const isLocked = c.retentionFundFrozen || c.status === "PENALTY_LOCKED"
            return (
              <div key={c._id || c.contractId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{c.contractId}</span>
                    <Badge
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        isLocked
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {isLocked ? "RETENTION DEPOSIT FROZEN" : "ACTIVE 36M WARRANTY"}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                    {c.roadName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {c.ward} • Contractor: <strong>{c.contractorName}</strong> • {c.surfaceType}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Warranty Expires: {new Date(c.dlpExpiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} • Retention Deposit: <strong>₹{(c.retentionFundAmountInr / 100000).toFixed(1)} Lakhs</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isLocked ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="border-rose-300 text-rose-600 text-xs font-semibold h-8 rounded-xl gap-1.5 opacity-80"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>₹{(c.retentionFundAmountInr / 100000).toFixed(1)}L Frozen</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleFreezeRetention(c.contractId)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-8 rounded-xl gap-1.5 shadow-sm"
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
    </div>
  )
}
