import { useState, useEffect, useCallback } from "react"
import {
  Leaf,
  Coins,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Trees,
  Bus,
  Sparkles,
  Calculator,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrencyINR, formatNumber } from "@/utils/formatters"
import toast from "react-hot-toast"
import {
  nextGenApi,
  type GreenBondPortfolio,
  type CarbonStream,
  type PredictiveBudgetResponse,
} from "@/services/nextGenApi"

export default function GreenBondLedger() {
  const [portfolio, setPortfolio] = useState<GreenBondPortfolio | null>(null)
  const [carbonStreams, setCarbonStreams] = useState<CarbonStream[]>([])
  const [loading, setLoading] = useState(true)

  // Predictive Budget State
  const [selectedWard, setSelectedWard] = useState("Ward G-North")
  const [historicalDefects, setHistoricalDefects] = useState(140)
  const [nullahKm, setNullahKm] = useState(18.5)
  const [rainAnomaly, setRainAnomaly] = useState(15)
  const [budgetForecast, setBudgetForecast] = useState<PredictiveBudgetResponse | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true)
      const res = await nextGenApi.getGreenBondPortfolio()
      setPortfolio(res.portfolio)
      setCarbonStreams(res.carbonStreams || [])
    } catch {
      toast.error("Failed to load green bond portfolio")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  const handleCalculateBudget = async () => {
    setIsCalculating(true)
    try {
      const res = await nextGenApi.getPredictiveBudget({
        ward: selectedWard,
        historicalRoadDefects: historicalDefects,
        nullahDesiltingLengthKm: nullahKm,
        projectedRainfallAnomalyPercent: rainAnomaly,
      })
      setBudgetForecast(res.budget)
      toast.success("Predictive ward budget model computed!", { icon: "📊" })
    } catch {
      toast.error("Failed to compute predictive budget")
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Municipal Green Bonds & Climate CapEx
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              AAA RATED MUNICIPAL BONDS
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              BMC Municipal Simulation Sandbox
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Transparent escrow for electric bus transit, solar microgrids, and urban mangrove restoration.
          </p>
        </div>

        <Button
          onClick={fetchPortfolio}
          variant="outline"
          size="sm"
          className="border-zinc-200 dark:border-zinc-800 text-xs font-medium gap-1.5 rounded-md h-9"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Ledger</span>
        </Button>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Green Bond Issuance
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-500" />
            <span>₹100.00 Cr</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Coupon: 7.15% p.a. • 10-Yr Sinking Fund</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Carbon Credits Earned
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span>{formatNumber(portfolio ? portfolio.totalCarbonCreditsEarnedTonnes : 14280)} tCO₂e</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Valuation: ₹2.85 Cr @ ₹2,000/ton</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            ESG Verification Status
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>SEBI ESG Tier 1</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Third-party audited municipal ledger</p>
        </div>
      </div>

      {/* Carbon Offset Streams Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-500" />
              <span>Verified Municipal Carbon Offset Streams</span>
            </h3>
            <p className="text-xs text-slate-500">Live tonnage and carbon abatement revenue generated across Wards</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {carbonStreams.map((cs) => (
            <div
              key={cs.streamId}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {cs.streamId.includes("CRZ") ? (
                    <Trees className="w-4 h-4 text-emerald-500" />
                  ) : cs.streamId.includes("EV") ? (
                    <Bus className="w-4 h-4 text-indigo-500" />
                  ) : (
                    <Leaf className="w-4 h-4 text-amber-500" />
                  )}
                  {cs.sector}
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 text-[10px]">
                  {cs.ward}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Carbon Abated:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{formatNumber(cs.carbonOffsetTons)} tCO₂e</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Annual Value:</span>
                  <strong className="text-slate-900 dark:text-white">{formatCurrencyINR(cs.annualRevenueInr)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predictive CapEx/OpEx Budget Modeling Engine */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-5 shadow-sm space-y-5">
        <div>
          <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>Predictive Ward CapEx & Climate Budget Modeling Engine</span>
          </h3>
          <p className="text-xs text-slate-500">
            Model fiscal year budget allocations based on historical road defect density, nullah desilting length, and projected monsoon rain anomalies.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Target Ward
            </label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <option value="Ward G-North">Ward G-North (Dadar / Dharavi)</option>
              <option value="Ward H-West">Ward H-West (Bandra)</option>
              <option value="Ward K-West">Ward K-West (Andheri)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Historical Defect Count
            </label>
            <input
              type="number"
              value={historicalDefects}
              onChange={(e) => setHistoricalDefects(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Nullah Length (Km)
            </label>
            <input
              type="number"
              step="0.5"
              value={nullahKm}
              onChange={(e) => setNullahKm(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Rain Anomaly (+%)
            </label>
            <input
              type="number"
              value={rainAnomaly}
              onChange={(e) => setRainAnomaly(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
            />
          </div>
        </div>

        <Button
          onClick={handleCalculateBudget}
          disabled={isCalculating}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold py-2 px-6 gap-2 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isCalculating ? "Calculating Allocation..." : "Calculate AI Budget Model"}</span>
        </Button>

        {budgetForecast && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase">
                FY26-27 Forecast for {budgetForecast.ward}
              </span>
              <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                Green Bond Subvention: ₹{(budgetForecast.greenBondFundingAllocationInr / 10000000).toFixed(2)} Cr
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">Road Maintenance OpEx:</span>
                <strong className="text-slate-900 dark:text-white text-sm">
                  ₹{(budgetForecast.budgetBreakdown.roadMaintenanceOpExInr / 100000).toFixed(1)} Lakhs
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">SWD Desilting OpEx:</span>
                <strong className="text-slate-900 dark:text-white text-sm">
                  ₹{(budgetForecast.budgetBreakdown.swdDesiltingOpExInr / 100000).toFixed(1)} Lakhs
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block">Climate Resilience CapEx:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                  ₹{(budgetForecast.budgetBreakdown.climateResilienceCapExInr / 100000).toFixed(1)} Lakhs
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block">Total Recommended Budget:</span>
                <strong className="text-emerald-800 dark:text-emerald-200 text-sm">
                  ₹{(budgetForecast.budgetBreakdown.totalRecommendedBudgetInr / 10000000).toFixed(2)} Cr
                </strong>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-sans italic">
              📌 {budgetForecast.executiveRecommendation}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
