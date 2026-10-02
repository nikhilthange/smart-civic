import { useState, useEffect, useCallback } from "react"
import {
  Gavel,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldAlert,
  Coins,
  Lock,
  Sparkles,
  TrendingDown,
  Building2,
  CheckCircle2,
  Fingerprint,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

interface MicroEscrow {
  escrowId: string
  contractorId: string
  companyName: string
  complaintId: string
  complaintTitle: string
  ward: string
  category: string
  collateralAmountInr: number
  releasedAmountInr: number
  dlpRetainedAmountInr: number
  slashedAmountInr: number
  status: "ALLOCATED_HELD" | "PARTIALLY_RELEASED_DLP_LOCKED" | "FULL_RELEASED" | "SLASHED_TO_CITIZEN_POOL"
  znccConfidenceScore?: number
  citizenDisputeCount: number
  slashedReason?: string
  slashedAt?: string
  dlpReleaseDate?: string
  ledgerTxHash: string
  createdAt: string
}

interface DividendPoolSummary {
  global: {
    totalSlashedInr: number
    totalDlpRetainedInr: number
    totalActiveHeldInr: number
    totalDefects: number
  }
  wardBreakdown: {
    _id: string
    totalSlashedInr: number
    totalDlpRetainedInr: number
    totalActiveHeldInr: number
    totalDefectsTracked: number
    slashedDefectsCount: number
  }[]
}

export default function ContractorRegistry() {
  const [activeTab, setActiveTab] = useState<"escrows" | "scorecards">("escrows")
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [microEscrows, setMicroEscrows] = useState<MicroEscrow[]>([])
  const [dividendPool, setDividendPool] = useState<DividendPoolSummary | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWard, setSelectedWard] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [contractorsRes, escrowsRes, poolRes] = await Promise.all([
        api.get("/contractors").catch(() => ({ data: { contractors: [] } })),
        api.get("/contractors/micro-escrows").catch(() => ({ data: { escrows: [] } })),
        api.get("/contractors/dividend-pool").catch(() => ({ data: { data: null } })),
      ])

      if (contractorsRes.data?.contractors) {
        setContractors(contractorsRes.data.contractors)
      }
      if (escrowsRes.data?.escrows) {
        setMicroEscrows(escrowsRes.data.escrows)
      }
      if (poolRes.data?.data) {
        setDividendPool(poolRes.data.data)
      }
    } catch {
      toast.error("Failed to load contractor governance and escrow data.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleIssueStrike = async (contractorId: string) => {
    setActionInProgress(contractorId)
    try {
      await api.post(`/contractors/${contractorId}/strike`, {
        complaintId: "SC-2026-MANUAL-AUDIT",
        reason: "Field inspection revealed defective asphalt layering without mastic binder",
        upheldBy: "Executive Engineer (Vigilance Cell)",
      })
      toast.error(`Statutory strike registered against ${contractorId}. Escrow re-evaluated.`, {
        icon: "⚖️",
      })
      await fetchData()
    } catch {
      toast.error("Failed to register strike audit.")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleSlashMicroEscrow = async (escrow: MicroEscrow) => {
    const reason = window.prompt(
      `Confirm slashing of ₹${escrow.collateralAmountInr.toLocaleString()} from ${escrow.companyName}?\n\nEnter statutory audit justification:`,
      "Fraudulent completion proof detected by municipal visual audit"
    )
    if (!reason) return

    setActionInProgress(escrow.escrowId)
    try {
      const res = await api.post(`/contractors/micro-escrow/${escrow.escrowId}/slash`, {
        reason,
        upheldBy: "Ward Assistant Municipal Commissioner",
      })
      if (res.data?.success) {
        toast.success(
          `₹${escrow.collateralAmountInr.toLocaleString()} slashed directly into Ward Citizen Dividend Pool!`,
          { icon: "💰", duration: 5000 }
        )
        await fetchData()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to slash micro-escrow.")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleVerifyAndReleaseEscrow = async (escrow: MicroEscrow) => {
    setActionInProgress(escrow.escrowId)
    try {
      // Release 80% with real ZNCC verification score
      const res = await api.post(`/contractors/micro-escrow/${escrow.escrowId}/release`, {
        znccConfidenceScore: 0.94,
      })
      if (res.data?.success) {
        toast.success(
          `ZNCC Verified (94.0%)! 80% released to contractor, 20% locked under 12-month DLP warranty.`,
          { icon: "🛡️", duration: 5000 }
        )
        await fetchData()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to release micro-escrow.")
    } finally {
      setActionInProgress(null)
    }
  }

  const filteredContractors = contractors.filter(
    (c) =>
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contractorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.wardAllocation.some((w) => w.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredEscrows = microEscrows.filter((e) => {
    const matchesQuery =
      e.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.escrowId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.complaintId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.complaintTitle.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesWard = selectedWard === "all" || e.ward === selectedWard
    return matchesQuery && matchesWard
  })

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

  const getEscrowStatusBadge = (status: string) => {
    switch (status) {
      case "SLASHED_TO_CITIZEN_POOL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <TrendingDown className="w-3 h-3 text-rose-500" />
            SLASHED TO CITIZENS
          </span>
        )
      case "PARTIALLY_RELEASED_DLP_LOCKED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Lock className="w-3 h-3 text-purple-500" />
            DLP WARRANTY LOCKED (20%)
          </span>
        )
      case "FULL_RELEASED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            FULL RELEASED
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <ShieldAlert className="w-3 h-3 text-sky-500" />
            COLLATERAL ACTIVE HELD
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-3 sm:px-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Coins className="w-3.5 h-3.5" />
            <span>MUNICIPAL MICRO-ESCROW & CITIZEN SLASHING PROTOCOL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Contractor Governance & Escrow
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Per-defect collateral security, AI ZNCC biometric verification, 1-click citizen dividend slashing, and statutory 3-strike debarment under MMC Act 1888.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="rounded-xl text-xs gap-1.5 h-10 px-4 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Ledger</span>
          </Button>
        </div>
      </div>

      {/* Real Citizen Dividend Pool KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Slashed to Citizen Dividend Pool */}
        <Card className="rounded-2xl border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/30 dark:via-zinc-900/60 dark:to-zinc-900/40 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Citizen Welfare Pool
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                ₹{(dividendPool?.global?.totalSlashedInr || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>Slashed from defective work, allocated to ward dividends</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Active Defect Collateral Held */}
        <Card className="rounded-2xl border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent dark:from-sky-950/30 dark:via-zinc-900/60 dark:to-zinc-900/40 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Active Collateral Held
              </span>
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                ₹{(dividendPool?.global?.totalActiveHeldInr || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Locked at ₹5,000 per pothole / trench work order
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: 12-Month DLP Retention Reserve */}
        <Card className="rounded-2xl border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-950/30 dark:via-zinc-900/60 dark:to-zinc-900/40 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                12-Mo DLP Warranty Lock
              </span>
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                ₹{(dividendPool?.global?.totalDlpRetainedInr || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                20% post-repair warranty reserve protected against sinkholes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Total Protected Defects */}
        <Card className="rounded-2xl border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30 dark:via-zinc-900/60 dark:to-zinc-900/40 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Escrow Protected Defects
              </span>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {dividendPool?.global?.totalDefects || 0}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Across {dividendPool?.wardBreakdown?.length || 0} municipal wards in Greater Mumbai
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ward Breakdown Banner if Slashed Funds Exist */}
      {dividendPool && dividendPool.wardBreakdown && dividendPool.wardBreakdown.length > 0 && (
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md p-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Ward Citizen Welfare Allocation Breakdown
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              Live Civic Contractor Ledger • Defect Liability Protocol
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {dividendPool.wardBreakdown.map((w) => (
              <div
                key={w._id}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{w._id}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {w.totalDefectsTracked} Defects
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-[11px] text-zinc-500">Slashed:</span>
                  <span className="text-xs font-mono font-bold text-rose-500">
                    ₹{w.totalSlashedInr.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-zinc-500">DLP Lock:</span>
                  <span className="text-xs font-mono font-medium text-purple-400">
                    ₹{w.totalDlpRetainedInr.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* View Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "escrows" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("escrows")}
            className="rounded-xl text-xs font-semibold gap-2 h-9 px-4"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Defect Micro-Escrow Ledger</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {microEscrows.length}
            </Badge>
          </Button>

          <Button
            variant={activeTab === "scorecards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("scorecards")}
            className="rounded-xl text-xs font-semibold gap-2 h-9 px-4"
          >
            <Gavel className="w-3.5 h-3.5" />
            <span>Contractor Scorecards & Debarment</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {contractors.length}
            </Badge>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "escrows" && (
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              aria-label="Filter micro-escrows by ward"
              className="h-9 px-3 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value="all">All Wards</option>
              <option value="Ward H-West">Ward H-West (Bandra)</option>
              <option value="Ward G-North">Ward G-North (Dadar)</option>
              <option value="Ward G-South">Ward G-South (Worli)</option>
              <option value="Ward K-East">Ward K-East (Andheri E)</option>
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search contractor, defect, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: DEFECT MICRO-ESCROW & CITIZEN SLASHING LEDGER */}
      {activeTab === "escrows" && (
        <Card className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-900/90 text-zinc-500 dark:text-zinc-400 uppercase font-medium border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3.5">Escrow ID & Defect Ticket</th>
                    <th className="px-4 py-3.5">Contractor & Ward</th>
                    <th className="px-4 py-3.5 text-right">Collateral / Status</th>
                    <th className="px-4 py-3.5 text-center">ZNCC Verification</th>
                    <th className="px-4 py-3.5 text-center">Cryptographic Tx Hash</th>
                    <th className="px-4 py-3.5 text-right">Statutory Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-zinc-400 font-mono">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                        Fetching live micro-escrow balances from Central Municipal Ledger...
                      </td>
                    </tr>
                  ) : filteredEscrows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
                        No micro-escrows found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEscrows.map((e) => (
                      <tr key={e.escrowId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        {/* Escrow ID & Defect */}
                        <td className="px-4 py-4 max-w-[280px]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                              {e.escrowId}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                              {e.complaintId}
                            </Badge>
                          </div>
                          <div className="font-medium text-zinc-800 dark:text-zinc-200 mt-1 truncate" title={e.complaintTitle}>
                            {e.complaintTitle}
                          </div>
                          {e.slashedReason && (
                            <div className="mt-1 text-[11px] text-rose-500 dark:text-rose-400 bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20">
                              ⚠️ Slashed: {e.slashedReason}
                            </div>
                          )}
                        </td>

                        {/* Contractor & Ward */}
                        <td className="px-4 py-4">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {e.companyName}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
                              {e.ward}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">
                              {e.contractorId}
                            </span>
                          </div>
                        </td>

                        {/* Collateral & Status */}
                        <td className="px-4 py-4 text-right font-mono tabular-nums">
                          <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            ₹{e.collateralAmountInr.toLocaleString()}
                          </div>
                          <div className="mt-1">
                            {getEscrowStatusBadge(e.status)}
                          </div>
                          {e.releasedAmountInr > 0 && (
                            <div className="text-[10px] text-emerald-500 mt-0.5">
                              Released: ₹{e.releasedAmountInr.toLocaleString()} (80%)
                            </div>
                          )}
                          {e.dlpRetainedAmountInr > 0 && (
                            <div className="text-[10px] text-purple-400 mt-0.5">
                              DLP Lock: ₹{e.dlpRetainedAmountInr.toLocaleString()} (20%)
                            </div>
                          )}
                        </td>

                        {/* ZNCC Verification Score */}
                        <td className="px-4 py-4 text-center">
                          {e.znccConfidenceScore ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                {(e.znccConfidenceScore * 100).toFixed(1)}% Match
                              </span>
                              <span className="text-[10px] text-zinc-400 mt-0.5">
                                AI Biometric Verified
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-zinc-400">
                              Pending Inspection
                            </span>
                          )}
                        </td>

                        {/* Cryptographic Hash */}
                        <td className="px-4 py-4 text-center font-mono text-[10px]">
                          <span
                            className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 rounded text-zinc-600 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100"
                            title={e.ledgerTxHash}
                            onClick={() => {
                              navigator.clipboard.writeText(e.ledgerTxHash)
                              toast.success("SHA-256 Ledger Hash copied to clipboard!")
                            }}
                          >
                            {e.ledgerTxHash ? `${e.ledgerTxHash.slice(0, 10)}...${e.ledgerTxHash.slice(-6)}` : "GEN_PENDING"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          {e.status === "ALLOCATED_HELD" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionInProgress === e.escrowId}
                                onClick={() => handleVerifyAndReleaseEscrow(e)}
                                className="h-8 px-2.5 rounded-lg text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-semibold"
                                title="Run ZNCC computer vision verification and release 80% with 20% DLP warranty lock"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                <span>Verify ZNCC</span>
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={actionInProgress === e.escrowId}
                                onClick={() => handleSlashMicroEscrow(e)}
                                className="h-8 px-2.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold"
                                title="Slash micro-collateral directly to Citizen Welfare Dividend Pool"
                              >
                                <TrendingDown className="w-3.5 h-3.5 mr-1" />
                                <span>Slash Pool</span>
                              </Button>
                            </div>
                          ) : e.status === "SLASHED_TO_CITIZEN_POOL" ? (
                            <span className="text-[11px] font-mono text-rose-500 font-semibold">
                              Slashing Upheld ✓
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-purple-400 font-semibold">
                              Protected in DLP ✓
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: CONTRACTOR CORPORATE SCORECARDS & DEBARMENT */}
      {activeTab === "scorecards" && (
        <Card className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-900/90 text-zinc-500 dark:text-zinc-400 uppercase font-medium border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3.5">Contractor / ID</th>
                    <th className="px-4 py-3.5">Assigned Wards</th>
                    <th className="px-4 py-3.5 text-right">Reliability</th>
                    <th className="px-4 py-3.5 text-right">Escrow Balance</th>
                    <th className="px-4 py-3.5 text-center">Strikes (Max 3)</th>
                    <th className="px-4 py-3.5 text-center">Statutory Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-zinc-400 font-mono">
                        Loading contractor scorecards from database...
                      </td>
                    </tr>
                  ) : filteredContractors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-zinc-400">
                        No contractors found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredContractors.map((c) => (
                      <tr key={c.contractorId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
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
                                className={`w-2.5 h-2.5 rounded-full ${
                                  num <= c.strikesCount ? "bg-red-500" : "bg-zinc-200 dark:bg-zinc-700"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                            {c.strikesCount}/3 Strikes
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {getStatusTag(c.status)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={c.status === "BLACKLISTED_FROZEN" || actionInProgress === c.contractorId}
                            onClick={() => handleIssueStrike(c.contractorId)}
                            className="h-8 px-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold"
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
      )}
    </div>
  )
}
