import { useState, useEffect } from "react"
import {
  Gavel,
  RefreshCw,
  Search,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import api from "@/lib/axios"

interface Contractor {
  contractorId: string
  companyName: string
  authorizedContact: string
  phone: string
  wardAllocation: string[]
  activeWorkOrdersCount: number
  completedWorkOrdersCount: number
  escrowBalanceInr: number
  frozenEscrowInr: number
  strikesCount: number
  znccAverageConfidence: number
  reliabilityScore: number
  status: "ACTIVE_GOOD_STANDING" | "UNDER_PROBATION" | "BLACKLISTED_FROZEN"
  strikeLogs: {
    strikeNumber: number
    complaintId: string
    reason: string
    upheldBy: string
    issuedAt: string
  }[]
  statutoryDebarmentOrder?: {
    orderNumber: string
    legalSection: string
  }
}

export default function ContractorRegistry() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const fetchContractors = async () => {
    setIsLoading(true)
    try {
      const res = await api.get("/contractors")
      if (res.data.contractors) setContractors(res.data.contractors)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchContractors()
  }, [])

  const handleIssueStrike = async (contractorId: string) => {
    try {
      await api.post(`/contractors/${contractorId}/strike`, {
        complaintId: "SC-2026-MANUAL-AUDIT",
        reason: "Field inspection revealed defective asphalt layering without mastic binder",
        upheldBy: "Executive Engineer (Vigilance Cell)",
      })
      toast.error(`Strike registered against ${contractorId}. Escrow re-evaluated.`, {
        icon: "⚖️",
      })
      fetchContractors()
    } catch {
      toast.error("Failed to register strike audit.")
    }
  }

  const filtered = contractors.filter(
    (c) =>
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contractorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.wardAllocation.some((w) => w.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getStatusTag = (status: string) => {
    if (status === "ACTIVE_GOOD_STANDING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          ACTIVE GOOD STANDING
        </span>
      )
    }
    if (status === "UNDER_PROBATION") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          UNDER PROBATION
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        BLACKLISTED & FROZEN
      </span>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>MUNICIPAL VIGILANCE LEDGER</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Contractor Governance & Escrow
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Performance audit scorecards, 3-strike statutory debarment, and escrow deposit freezes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter contractor or ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchContractors}
            disabled={isLoading}
            className="rounded-md text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Structured Contractor Table */}
      <Card className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-lg shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 uppercase font-medium border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Contractor / ID</th>
                  <th className="px-4 py-3">Wards</th>
                  <th className="px-4 py-3 text-right">Reliability</th>
                  <th className="px-4 py-3 text-right">Escrow Balance</th>
                  <th className="px-4 py-3 text-center">Strikes</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-400 font-mono">
                      Loading contractor scorecards from database...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                      No contractors found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.contractorId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3.5 max-w-[240px]">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={c.companyName}>
                          {c.companyName}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500 truncate" title={`${c.contractorId} • ${c.authorizedContact}`}>
                          {c.contractorId} • {c.authorizedContact}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {c.wardAllocation.map((w) => (
                            <span key={w} className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
                              {w}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{c.reliabilityScore}/100</span>
                        <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full ml-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full ${
                              c.reliabilityScore >= 80 ? "bg-emerald-500" : c.reliabilityScore >= 60 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${c.reliabilityScore}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          ₹{(c.escrowBalanceInr / 100000).toFixed(1)}L
                        </div>
                        {c.frozenEscrowInr > 0 && (
                          <div className="text-[10px] text-red-500 font-mono">
                            ₹{(c.frozenEscrowInr / 100000).toFixed(1)}L Frozen
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {[1, 2, 3].map((num) => (
                            <span
                              key={num}
                              className={`w-2 h-2 rounded-full ${
                                num <= c.strikesCount ? "bg-red-500" : "bg-zinc-200 dark:bg-zinc-700"
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {getStatusTag(c.status)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleIssueStrike(c.contractorId)}
                          disabled={c.status === "BLACKLISTED_FROZEN"}
                          className="h-8 px-2.5 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-medium"
                        >
                          <Gavel className="w-3.5 h-3.5 mr-1" />
                          <span>Audit Strike</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
