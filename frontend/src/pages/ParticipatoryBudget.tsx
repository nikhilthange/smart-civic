import { useState, useEffect, useCallback } from "react"
import {
  Coins,
  Vote,
  RefreshCw,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { municipalApi, type WardProject, type CorporatorLedger } from "@/services/municipalApi"
import toast from "react-hot-toast"

export default function ParticipatoryBudget() {
  const [projects, setProjects] = useState<WardProject[]>([])
  const [ledger, setLedger] = useState<CorporatorLedger | null>(null)
  const [selectedWard, setSelectedWard] = useState("Ward G-North")
  const [loading, setLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [projRes, ledgerRes] = await Promise.all([
        municipalApi.getWardProjects(selectedWard),
        municipalApi.getCorporatorLedger(selectedWard),
      ])
      setProjects(projRes.projects)
      setLedger(ledgerRes)
    } catch {
      toast.error("Failed to load participatory ward budget data")
    } finally {
      setLoading(false)
    }
  }, [selectedWard])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleVote = async (projectId: string) => {
    setIsVoting(true)
    try {
      const res = await municipalApi.castVote(projectId)
      if (res.success) {
        toast.success(res.message, { icon: "🗳️", duration: 5000 })
        fetchData()
      } else {
        toast.error(res.message)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Voting failed"
      toast.error(msg)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-2 pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
              Participatory Ward Budgeting & Corporator Ledger
            </h1>
            <Badge className="bg-emerald-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full">
              CITIZEN DIRECT DEMOCRACY
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Cast weighted citizen votes on local municipal infrastructure funds and audit corporator development ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold"
          >
            <option value="Ward G-North">Ward G-North (Dadar / Shivaji Park)</option>
            <option value="Ward H-West">Ward H-West (Bandra / Khar)</option>
            <option value="Ward K-West">Ward K-West (Andheri / Versova)</option>
          </select>
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            className="border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5 rounded-xl h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Corporator Discretionary Fund Ledger Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Annual Fund Allocation
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            ₹2.50 Crores
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">BMC Corporator Discretionary Grant</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Citizen Approved Projects
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{ledger ? (ledger.committedProjectsBudgetInr / 100000).toFixed(1) : "60.0"} Lakhs
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {ledger?.utilizationPercentage ?? 24}% Fund Committed
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Disbursed Expenditure
          </span>
          <div className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-2">
            ₹{ledger ? (ledger.disbursedExpenditureInr / 100000).toFixed(1) : "32.0"} Lakhs
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Audited contractor payments</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Ward Councilor
          </span>
          <div className="text-sm font-bold font-display text-slate-900 dark:text-white mt-2 truncate">
            {ledger?.corporatorName || "Adv. Rahul Sawant"}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{selectedWard}</p>
        </div>
      </div>

      {/* Participatory Projects Voting Deck */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Vote className="w-4 h-4 text-emerald-600" />
            Vote on Proposed Ward Infrastructure Projects (Q2-2026)
          </h2>
          <span className="text-xs font-mono text-slate-400">1 Vote per Verified Citizen</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((proj) => {
            const isApproved = proj.status === "CITIZEN_APPROVED" || proj.status === "IN_EXECUTION"
            return (
              <Card
                key={proj._id || proj.projectId}
                className="border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{proj.projectId}</span>
                    <Badge
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        isApproved
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {proj.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {proj.description}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono">Estimated Budget</span>
                      <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        ₹{(proj.estimatedBudgetInr / 100000).toFixed(1)} Lakhs
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono">Beneficiaries</span>
                      <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        ~{(proj.estimatedBeneficiaryCitizens / 1000).toFixed(0)}k Citizens
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Vote className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">
                      {proj.votesCount} Citizen Votes
                    </span>
                  </div>
                  <Button
                    size="sm"
                    disabled={isVoting}
                    onClick={() => handleVote(proj.projectId || proj._id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 px-4 rounded-xl gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <Vote className="w-3.5 h-3.5" />
                    <span>Cast Ward Vote</span>
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
