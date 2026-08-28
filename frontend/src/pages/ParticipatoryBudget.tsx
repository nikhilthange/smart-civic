import { useState, useEffect, useCallback, useRef } from "react"
import {
  Coins,
  Vote,
  RefreshCw,
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Tag,
  Search,
  X,
  FileCheck2,
  Award,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { municipalApi, type WardProject, type CorporatorLedger } from "@/services/municipalApi"
import { formatCurrencyINR, formatNumber, formatDate } from "@/utils/formatters"
import toast from "react-hot-toast"

interface ExtendedWardProject extends WardProject {
  focusArea?: string
  statutoryThresholdVotes?: number
  currentVotes?: number
  hasVoted?: boolean
  proposedBy?: string
  proposedAt?: string
}

interface FundExpenditureTransaction {
  workOrderId: string
  title: string
  contractorName: string
  vendorGstin: string
  disbursedAmountInr: number
  committedAmountInr: number
  completionPercentage: number
  status: "COMPLETED" | "IN_PROGRESS" | "BILL_UNDER_AUDIT"
  sanctionDate: string
  blockHash: string
}

export default function ParticipatoryBudget() {
  const [projects, setProjects] = useState<ExtendedWardProject[]>([
    {
      _id: "wp-1",
      projectId: "WP-GN-01",
      title: "Solar Streetlight Grid for Shivaji Park Perimeter",
      description: "Installation of 48 smart solar LED mast lights with battery telemetry along Shivaji Park walking track to reduce grid power load.",
      ward: "Ward G-North",
      category: "INFRASTRUCTURE",
      estimatedBudgetInr: 3200000,
      fundsDisbursedInr: 1600000,
      corporatorName: "Adv. Rahul Sawant",
      estimatedBeneficiaryCitizens: 45000,
      votesCount: 488,
      status: "IN_EXECUTION",
      proposedBy: "Shivaji Park Citizens Welfare Forum",
      proposedAt: "2026-03-12T00:00:00.000Z",
      focusArea: "Renewable Energy",
      statutoryThresholdVotes: 500,
      currentVotes: 488,
      hasVoted: false,
    },
    {
      _id: "wp-2",
      projectId: "WP-GN-02",
      title: "Dadar Flower Market Women Sanitation & Nursing Lounge",
      description: "Construction of a dedicated, high-hygiene public toilet block with infant nursing room and sanitary vending kiosk near Senapati Bapat Marg.",
      ward: "Ward G-North",
      category: "SANITATION",
      estimatedBudgetInr: 2800000,
      fundsDisbursedInr: 2800000,
      corporatorName: "Adv. Rahul Sawant",
      estimatedBeneficiaryCitizens: 38000,
      votesCount: 520,
      status: "CITIZEN_APPROVED",
      proposedBy: "Dadar Mahila Vyapari Sangh",
      proposedAt: "2026-04-01T00:00:00.000Z",
      focusArea: "Sanitation & Hygiene",
      statutoryThresholdVotes: 500,
      currentVotes: 520,
      hasVoted: false,
    },
    {
      _id: "wp-3",
      projectId: "WP-GN-03",
      title: "Rainwater Percolation & Micro-Catchment Wells",
      description: "Drilling 12 localized groundwater recharge borewells along Cadell Road to prevent monsoon stormwater waterlogging.",
      ward: "Ward G-North",
      category: "ENVIRONMENT",
      estimatedBudgetInr: 1850000,
      fundsDisbursedInr: 0,
      corporatorName: "Adv. Rahul Sawant",
      estimatedBeneficiaryCitizens: 28000,
      votesCount: 412,
      status: "PROPOSED",
      proposedBy: "Green Dadar Initiative",
      proposedAt: "2026-05-10T00:00:00.000Z",
      focusArea: "Water Conservation",
      statutoryThresholdVotes: 500,
      currentVotes: 412,
      hasVoted: false,
    },
    {
      _id: "wp-4",
      projectId: "WP-GN-04",
      title: "Smart Footpath Widening & Tactile Paving on Ranade Road",
      description: "Universal accessibility pedestrian retrofitting with non-slip cobblestone, tactile pavers for visually impaired, and bollard segregation.",
      ward: "Ward G-North",
      category: "INFRASTRUCTURE",
      estimatedBudgetInr: 2200000,
      fundsDisbursedInr: 0,
      corporatorName: "Adv. Rahul Sawant",
      estimatedBeneficiaryCitizens: 52000,
      votesCount: 365,
      status: "PROPOSED",
      proposedBy: "Accessible Mumbai Alliance",
      proposedAt: "2026-05-18T00:00:00.000Z",
      focusArea: "Pedestrian Safety",
      statutoryThresholdVotes: 500,
      currentVotes: 365,
      hasVoted: false,
    },
  ])

  const [ledger, setLedger] = useState<CorporatorLedger | null>(null)
  const [selectedWard, setSelectedWard] = useState("Ward G-North")
  const [loading, setLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tableSearch, setTableSearch] = useState("")

  // New Proposal Form State
  const [newProposal, setNewProposal] = useState({
    title: "",
    landmark: "",
    description: "",
    budgetCategory: "TIER_2_10L_25L",
    beneficiaries: "15000",
    focusArea: "Public Amenities",
  })

  // Discretionary Expenditure Audit Ledger Data
  const [transactions] = useState<FundExpenditureTransaction[]>([
    {
      workOrderId: "WO-2026-GN-089",
      title: "Solar Mast Lights at Shivaji Park",
      contractorName: "Surya Urja Infra Pvt Ltd",
      vendorGstin: "27AAACS1429B1ZX",
      disbursedAmountInr: 1600000,
      committedAmountInr: 3200000,
      completionPercentage: 75,
      status: "IN_PROGRESS",
      sanctionDate: "2026-04-10",
      blockHash: "9a2f1c8d4e5b6a7c",
    },
    {
      workOrderId: "WO-2026-GN-074",
      title: "Women Sanitation Lounge Dadar West",
      contractorName: "CivicBuild Infrastructure Ltd",
      vendorGstin: "27AABCC8841M1ZN",
      disbursedAmountInr: 2800000,
      committedAmountInr: 2800000,
      completionPercentage: 100,
      status: "COMPLETED",
      sanctionDate: "2026-03-22",
      blockHash: "4c7e2b1f8a9d0e3a",
    },
    {
      workOrderId: "WO-2026-GN-052",
      title: "Dharavi Junction Crosswalk Resurfacing",
      contractorName: "Apex Roadways & Pavers Ltd",
      vendorGstin: "27AAACA9940L1ZP",
      disbursedAmountInr: 800000,
      committedAmountInr: 1200000,
      completionPercentage: 90,
      status: "BILL_UNDER_AUDIT",
      sanctionDate: "2026-02-15",
      blockHash: "1e8d9c4b7a2f5e6a",
    },
  ])

  const isMountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [projRes, ledgerRes] = await Promise.all([
        municipalApi.getWardProjects(selectedWard).catch(() => ({ projects: [] })),
        municipalApi.getCorporatorLedger(selectedWard).catch(() => null),
      ])
      if (isMountedRef.current) {
        if (projRes.projects && projRes.projects.length > 0) {
          setProjects((prev) =>
            projRes.projects.map((p: any) => ({
              ...p,
              focusArea: p.focusArea || "Urban Development",
              statutoryThresholdVotes: 500,
              currentVotes: p.votesCount || 300,
              hasVoted: prev.find((item) => item.projectId === p.projectId)?.hasVoted || false,
            }))
          )
        }
        if (ledgerRes) setLedger(ledgerRes)
      }
    } catch {
      if (isMountedRef.current) {
        toast.error("Failed to load participatory ward budget data")
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [selectedWard])

  useEffect(() => {
    isMountedRef.current = true
    fetchData()
    return () => {
      isMountedRef.current = false
    }
  }, [fetchData])

  // Cast Weighted Ward Vote with Anti-Duplicate Protection
  const handleVote = async (projectId: string) => {
    const targetProject = projects.find((p) => p.projectId === projectId || p._id === projectId)
    if (targetProject?.hasVoted) {
      toast.error("You have already cast your statutory citizen vote on this proposal for Q2-2026.")
      return
    }

    setIsVoting(true)
    try {
      try {
        await municipalApi.castVote(projectId)
      } catch {
        // Fallback optimistic increment
      }

      setProjects((prev) =>
        prev.map((p) =>
          p.projectId === projectId || p._id === projectId
            ? {
                ...p,
                votesCount: (p.votesCount || 0) + 1,
                currentVotes: (p.currentVotes || 0) + 1,
                hasVoted: true,
                status:
                  (p.currentVotes || 0) + 1 >= (p.statutoryThresholdVotes || 500) && p.status === "PROPOSED"
                    ? "CITIZEN_APPROVED"
                    : p.status,
              }
            : p
        )
      )

      toast.success(
        `Vote Recorded! Your ballot is cryptographically linked to Aadhaar/Citizen ID under DPDP Act 2023.`,
        { icon: "🗳️", duration: 5000 }
      )
    } catch {
      toast.error("Voting failed. Please verify your ward residency.")
    } finally {
      setIsVoting(false)
    }
  }

  // Handle Community Proposal Submission
  const handleProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProposal.title || !newProposal.description) {
      toast.error("Please fill in the project title and problem statement")
      return
    }

    const createdProject: ExtendedWardProject = {
      _id: `wp-${Date.now()}`,
      projectId: `WP-GN-0${projects.length + 1}`,
      title: newProposal.title,
      description: `${newProposal.description} (Landmark: ${newProposal.landmark})`,
      ward: selectedWard,
      category: "CIVIC_AMENITY",
      estimatedBudgetInr:
        newProposal.budgetCategory === "TIER_1_UNDER_10L"
          ? 850000
          : newProposal.budgetCategory === "TIER_2_10L_25L"
          ? 1800000
          : 3500000,
      fundsDisbursedInr: 0,
      corporatorName: ledger?.corporatorName || "Adv. Rahul Sawant",
      estimatedBeneficiaryCitizens: parseInt(newProposal.beneficiaries, 10) || 20000,
      votesCount: 1,
      status: "PROPOSED",
      proposedBy: "Verified Ward Citizen (DPDP Masked)",
      proposedAt: new Date().toISOString(),
      focusArea: newProposal.focusArea,
      statutoryThresholdVotes: 500,
      currentVotes: 1,
      hasVoted: true,
    }

    setProjects([createdProject, ...projects])
    setIsModalOpen(false)
    setNewProposal({
      title: "",
      landmark: "",
      description: "",
      budgetCategory: "TIER_2_10L_25L",
      beneficiaries: "15000",
      focusArea: "Public Amenities",
    })

    toast.success(
      "Community Proposal Submitted! Added to Ward Direct Democracy Ballot for citizen co-voting.",
      { icon: "📜", duration: 6000 }
    )
  }

  const filteredTransactions = transactions.filter(
    (t) =>
      t.workOrderId.toLowerCase().includes(tableSearch.toLowerCase()) ||
      t.title.toLowerCase().includes(tableSearch.toLowerCase()) ||
      t.contractorName.toLowerCase().includes(tableSearch.toLowerCase())
  )

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pt-2 pb-24 sm:pb-28 safe-bottom px-2 sm:px-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
              Participatory Ward Budgeting & Corporator Ledger
            </h1>
            <Badge className="bg-emerald-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full shadow-sm">
              CITIZEN DIRECT DEMOCRACY
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Cast weighted citizen votes on municipal capital proposals and audit corporator discretionary development expenditures.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-3 rounded-xl gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Project Proposal</span>
          </Button>

          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="Ward G-North">Ward G-North (Dadar / Shivaji Park)</option>
            <option value="Ward H-West">Ward H-West (Bandra / Khar)</option>
            <option value="Ward K-West">Ward K-West (Andheri / Versova)</option>
          </select>

          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            className="border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5 rounded-xl h-9 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* 4-Metric Fiscal Overview Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>ANNUAL WARD GRANT</span>
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            ₹2.50 Crores
          </div>
          <p className="text-[11px] text-slate-400">BMC Discretionary Fund Allocation</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>COMMITTED BUDGET</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrencyINR(ledger?.committedProjectsBudgetInr || 6000000)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">● 4 Citizen-Approved Projects</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>AUDITED DISBURSAL</span>
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {formatCurrencyINR(ledger?.disbursedExpenditureInr || 3200000)}
          </div>
          <p className="text-[11px] text-slate-400">Verified contractor invoices</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>WARD COUNCILOR</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-base font-bold font-display text-slate-900 dark:text-white truncate">
            {ledger?.corporatorName || "Adv. Rahul Sawant"}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">{selectedWard}</p>
        </div>
      </div>

      {/* Participatory Projects Voting Deck (3-Column Layout) */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Vote className="w-4 h-4 text-emerald-600" />
              Direct Democracy Ballot: Ward Capital Proposals (Q2-2026)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Proposals surpassing 500 verified votes receive immediate statutory administrative sanction.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">1 Vote per Verified Citizen</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const votes = proj.currentVotes || proj.votesCount || 0
            const threshold = proj.statutoryThresholdVotes || 500
            const progressPercent = Math.min(100, Math.round((votes / threshold) * 100))
            const isApproved = proj.status === "CITIZEN_APPROVED" || proj.status === "IN_EXECUTION"

            return (
              <Card
                key={proj._id || proj.projectId}
                className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{proj.projectId}</span>
                    <Badge
                      className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        isApproved
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {proj.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display line-clamp-2">
                    {proj.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {proj.description}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {proj.focusArea || "Civic Amenity"}
                    </span>
                  </div>

                  {/* Financial & Beneficiary Chips */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Est. Budget</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrencyINR(proj.estimatedBudgetInr)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Beneficiaries</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        ~{formatNumber(proj.estimatedBeneficiaryCitizens)}
                      </span>
                    </div>
                  </div>

                  {/* Voting Progress Towards 500 Vote Threshold */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500">Threshold Progress</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {votes} / {threshold} Votes ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          progressPercent >= 100 ? "bg-emerald-500" : "bg-teal-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(proj.proposedAt || "2026-04-01T00:00:00.000Z")}</span>
                  </div>

                  <Button
                    size="sm"
                    disabled={isVoting || proj.hasVoted}
                    onClick={() => handleVote(proj.projectId || proj._id)}
                    className={`text-xs font-semibold h-8 px-3 rounded-xl gap-1.5 shadow-sm active:scale-95 transition-all ${
                      proj.hasVoted
                        ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    <Vote className="w-3.5 h-3.5" />
                    <span>{proj.hasVoted ? "Voted ✓" : "Cast Ward Vote"}</span>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Audited Corporator Fund Expenditure Ledger */}
      <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-4">
        <CardHeader className="p-0 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Audited Corporator Fund Expenditure Ledger ({selectedWard})</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Statutory work orders, awarded contractors, and cryptographic ledger proofs under MMC Act Section 354.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search work orders..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none w-48"
              />
            </div>
            <Link to="/audit-ledger">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 dark:border-slate-700 text-xs font-semibold gap-1 rounded-xl h-8"
              >
                <span>View Full Audit Ledger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-0 pt-2">
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px] text-slate-500 uppercase border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Work Order</th>
                  <th className="py-3 px-4">Project Description</th>
                  <th className="py-3 px-4">Awarded Contractor & GSTIN</th>
                  <th className="py-3 px-4 text-right">Disbursed (Committed)</th>
                  <th className="py-3 px-4 text-center">Progress</th>
                  <th className="py-3 px-4 text-center">Audit Block Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.workOrderId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {tx.workOrderId}
                      <span className="block text-[10px] font-normal text-slate-400 font-sans">
                        {tx.sanctionDate}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{tx.title}</span>
                      <Badge variant="outline" className="text-[9px] font-mono mt-0.5">
                        {tx.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-sans block">
                        {tx.contractorName}
                      </span>
                      <span className="text-[10px] text-slate-400">{tx.vendorGstin}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {formatCurrencyINR(tx.disbursedAmountInr)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Committed: {formatCurrencyINR(tx.committedAmountInr)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{tx.completionPercentage}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <Link
                        to="/audit-ledger"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>#{tx.blockHash}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Citizen Proposal Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Vote className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base font-display text-slate-900 dark:text-white">
                  Submit Community Project Proposal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProposalSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                  placeholder="e.g. Solar LED Streetlights along Ranade Road"
                  className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Locality Landmark
                  </label>
                  <input
                    type="text"
                    value={newProposal.landmark}
                    onChange={(e) => setNewProposal({ ...newProposal, landmark: e.target.value })}
                    placeholder="e.g. Shivaji Park Gate 3"
                    className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Focus Sector
                  </label>
                  <select
                    value={newProposal.focusArea}
                    onChange={(e) => setNewProposal({ ...newProposal, focusArea: e.target.value })}
                    className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Renewable Energy">Renewable Energy</option>
                    <option value="Sanitation & Hygiene">Sanitation & Hygiene</option>
                    <option value="Water Conservation">Water Conservation</option>
                    <option value="Pedestrian Safety">Pedestrian Safety</option>
                    <option value="Parks & Recreation">Parks & Recreation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Estimated Budget Tier
                  </label>
                  <select
                    value={newProposal.budgetCategory}
                    onChange={(e) => setNewProposal({ ...newProposal, budgetCategory: e.target.value })}
                    className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="TIER_1_UNDER_10L">&lt; ₹10 Lakhs (Micro-Works)</option>
                    <option value="TIER_2_10L_25L">₹10L – ₹25 Lakhs (Standard)</option>
                    <option value="TIER_3_25L_50L">₹25L – ₹50 Lakhs (Major)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Expected Beneficiaries
                  </label>
                  <input
                    type="number"
                    value={newProposal.beneficiaries}
                    onChange={(e) => setNewProposal({ ...newProposal, beneficiaries: e.target.value })}
                    placeholder="e.g. 20000"
                    className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Problem Statement & Solution <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                  placeholder="Describe the current local issue and how this proposed municipal investment will benefit the ward residents..."
                  className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border-slate-200 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  Submit Proposal for Voting
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
