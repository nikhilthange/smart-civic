import { useState, useEffect, useCallback } from "react"
import {
  Gavel,
  RefreshCw,
  Search,
  ShieldCheck,
  Scale,
  Coins,
  AlertTriangle,
  Building2,
  CheckCircle2,
  UserX,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  advancedMunicipalApi,
  type RtsStatutoryPenalty,
  type RtsSummary,
} from "@/services/advancedMunicipalApi"
import { formatCurrencyINR } from "@/utils/formatters"
import toast from "react-hot-toast"

export default function RtsEnforcementRadar() {
  const [penalties, setPenalties] = useState<RtsStatutoryPenalty[]>([])
  const [summary, setSummary] = useState<RtsSummary | null>(null)
  const [selectedWard, setSelectedWard] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAuditing, setIsAuditing] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [penaltiesRes, summaryRes] = await Promise.all([
        advancedMunicipalApi.getRtsPenalties({
          ward: selectedWard !== "all" ? selectedWard : undefined,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
        }),
        advancedMunicipalApi.getRtsSummary(),
      ])

      if (penaltiesRes.penalties) setPenalties(penaltiesRes.penalties)
      if (summaryRes.summary) setSummary(summaryRes.summary)
    } catch {
      toast.error("Failed to load RTS statutory enforcement data.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedWard, selectedStatus])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRunAudit = async () => {
    setIsAuditing(true)
    try {
      const res = await advancedMunicipalApi.runRtsComplianceAudit()
      toast.success(res.message || "Statutory compliance audit completed.", {
        duration: 5000,
      })
      await fetchData()
    } catch {
      toast.error("Failed to run statutory compliance audit.")
    } finally {
      setIsAuditing(false)
    }
  }

  const handleAdjudicate = async (notice: RtsStatutoryPenalty, decision: "SALARY_DEDUCTION_ENFORCED" | "FORCE_MAJEURE_EXCUSED") => {
    const note = window.prompt(
      `First Appellate Authority Adjudication for ${notice.noticeNumber} (${notice.designatedOfficer.name}):\n\nEnter statutory hearing justification:`,
      decision === "SALARY_DEDUCTION_ENFORCED"
        ? "Section 10 delay confirmed without valid force majeure exception."
        : "Legitimate emergency conditions accepted under Section 10(2)."
    )
    if (!note) return

    setActionInProgress(notice.noticeNumber)
    try {
      const res = await advancedMunicipalApi.adjudicateRtsPenalty(notice.noticeNumber, {
        decision,
        note,
        adjudicatedBy: "First Appellate Authority (Ward AMC)",
      })
      if (res.success) {
        toast.success(
          decision === "SALARY_DEDUCTION_ENFORCED"
            ? `Statutory penalty of ₹${notice.totalPenaltyAmountInr} debited from officer monthly salary.`
            : "Force majeure exception accepted by Appellate Authority.",
          { duration: 5000 }
        )
        await fetchData()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to adjudicate statutory notice.")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleCompensateCitizen = async (notice: RtsStatutoryPenalty) => {
    setActionInProgress(notice.noticeNumber)
    try {
      const res = await advancedMunicipalApi.compensateRtsCitizen(notice.noticeNumber)
      if (res.success) {
        toast.success(
          `Citizen Delay Compensation Voucher of ₹${notice.totalPenaltyAmountInr} issued and credited to complainant under Section 10.`,
          { duration: 6000 }
        )
        await fetchData()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to disburse citizen compensation.")
    } finally {
      setActionInProgress(null)
    }
  }

  const filteredPenalties = penalties.filter((p) => {
    const q = searchQuery.toLowerCase()
    return (
      p.noticeNumber.toLowerCase().includes(q) ||
      p.complaintId.toLowerCase().includes(q) ||
      p.complaintTitle.toLowerCase().includes(q) ||
      p.designatedOfficer.name.toLowerCase().includes(q) ||
      p.designatedOfficer.employeeId.toLowerCase().includes(q) ||
      p.ward.toLowerCase().includes(q)
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CITIZEN_COMPENSATED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            CITIZEN COMPENSATED
          </span>
        )
      case "SALARY_DEDUCTION_ENFORCED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <UserX className="w-3 h-3 text-rose-500" />
            SALARY DEBIT ENFORCED
          </span>
        )
      case "FORCE_MAJEURE_EXCUSED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <ShieldCheck className="w-3 h-3 text-slate-500" />
            EXCUSED (FORCE MAJEURE)
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-500" />
            SHOW-CAUSE ISSUED
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-3 sm:px-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Scale className="w-3.5 h-3.5" />
            <span>MAHARASHTRA GUARANTEE OF PUBLIC SERVICES (RTS) ACT 2015</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Statutory Right to Service (RTS) Enforcement
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-3xl">
            Section 10 automated officer salary deductions (₹250/day up to ₹5,000), SHA-256 sealed show-cause notices, and direct citizen compensatory dividend redistribution.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="rounded-xl text-xs gap-1.5 h-10 px-4 border-indigo-500/30 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          >
            <Gavel className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin" : ""}`} />
            <span>Audit Overdue SLAs</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="rounded-xl text-xs gap-1.5 h-10 px-4 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sync Ledger</span>
          </Button>
        </div>
      </div>

      {/* 4-Metric Real RTS KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Salary Deductions Enforced */}
        <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Officer Salary Debited
              </span>
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-rose-600 dark:text-rose-400">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                ₹{(summary?.global?.totalSalaryDeductedInr || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                <Gavel className="w-3 h-3 text-rose-500" />
                <span>Section 10 payroll penalties recovered</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Citizen Compensation Disbursed */}
        <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Citizen Delay Dividends
              </span>
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                ₹{(summary?.global?.totalCitizenCompensationDisbursedInr || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>Redistributed to aggrieved citizens</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Active Show-Causes */}
        <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Active Show-Causes
              </span>
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {summary?.global?.activeShowCausesCount || 0}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Under 7-day First Appellate Authority hearing
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Total Statutory Notices Issued */}
        <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Statutory Fines Assessed
              </span>
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrencyINR(summary?.global?.totalPenaltyAssessedInr || 0)}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Across {summary?.global?.totalNotices || 0} formal statutory orders
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ward Breakdown Banner */}
      {summary?.wardBreakdown && summary.wardBreakdown.length > 0 && (
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md p-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Ward-Wise Statutory Recovery & Compensation Ledger
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              Live Statutory Audit Stream • Maharashtra RTS Act 2015
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summary.wardBreakdown.map((w) => (
              <div
                key={w._id}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{w._id}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {w.noticesCount} Orders
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-[11px] text-zinc-500">Salary Debit:</span>
                  <span className="text-xs font-mono font-bold text-rose-500">
                    ₹{w.salaryDeductedInr.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-zinc-500">Citizen Paid:</span>
                  <span className="text-xs font-mono font-bold text-emerald-500">
                    ₹{w.compensationDisbursedInr.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="h-9 px-3 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none"
          >
            <option value="all">All Wards</option>
            <option value="Ward G-North">Ward G-North (Dadar / Shivaji Park)</option>
            <option value="Ward H-West">Ward H-West (Bandra / Khar)</option>
            <option value="Ward G-South">Ward G-South (Worli)</option>
            <option value="Ward K-East">Ward K-East (Andheri East)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="SHOW_CAUSE_ISSUED">Show-Cause Issued</option>
            <option value="SALARY_DEDUCTION_ENFORCED">Salary Deduction Enforced</option>
            <option value="CITIZEN_COMPENSATED">Citizen Compensated</option>
            <option value="FORCE_MAJEURE_EXCUSED">Force Majeure Excused</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search officer, notice, ticket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Structured Show-Cause & Salary Deduction Table */}
      <Card className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-900/90 text-zinc-500 dark:text-zinc-400 uppercase font-medium border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3.5">Notice Number & Complaint</th>
                  <th className="px-4 py-3.5">Designated Officer</th>
                  <th className="px-4 py-3.5 text-right">Delay & Fine</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Digital Seal Hash</th>
                  <th className="px-4 py-3.5 text-right">First Appellate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-zinc-400 font-mono">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading statutory RTS show-cause dockets from Central Registry...
                    </td>
                  </tr>
                ) : filteredPenalties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
                      No statutory RTS penalty records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPenalties.map((p) => (
                    <tr key={p.noticeNumber} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      {/* Notice Number & Complaint */}
                      <td className="px-4 py-4 max-w-[280px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            {p.noticeNumber}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                            {p.complaintId}
                          </Badge>
                        </div>
                        <div className="font-medium text-zinc-800 dark:text-zinc-200 mt-1 truncate" title={p.complaintTitle}>
                          {p.complaintTitle}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {p.ward} • Limit: {p.statutoryTimeLimitHours}h • Elapsed: {p.elapsedHours}h
                        </div>
                        {p.adjudicationNote && (
                          <div className="mt-1.5 text-[11px] text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            {p.adjudicationNote}
                          </div>
                        )}
                      </td>

                      {/* Designated Officer */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {p.designatedOfficer.name}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500">
                          {p.designatedOfficer.employeeId} • {p.designatedOfficer.designation}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          Dept: {p.designatedOfficer.departmentCode}
                        </div>
                      </td>

                      {/* Delay & Fine */}
                      <td className="px-4 py-4 text-right font-mono tabular-nums">
                        <div className="font-bold text-sm text-rose-600 dark:text-rose-400">
                          ₹{p.totalPenaltyAmountInr.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          {p.delayDays} day(s) @ ₹250/d
                        </div>
                        {p.citizenCompensationPaidInr > 0 && (
                          <div className="text-[10px] text-emerald-500 font-bold mt-0.5">
                            Compensated: ₹{p.citizenCompensationPaidInr.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        {getStatusBadge(p.status)}
                        {p.citizenCompensationVoucher && (
                          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                            {p.citizenCompensationVoucher}
                          </div>
                        )}
                      </td>

                      {/* Digital Seal Hash */}
                      <td className="px-4 py-4 text-center font-mono text-[10px]">
                        <span
                          className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 rounded text-zinc-600 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100"
                          title={p.legalNoticeHash}
                          onClick={() => {
                            navigator.clipboard.writeText(p.legalNoticeHash)
                            toast.success("RTS Notice SHA-256 Digital Seal copied!")
                          }}
                        >
                          {p.legalNoticeHash ? `${p.legalNoticeHash.slice(0, 10)}...${p.legalNoticeHash.slice(-6)}` : "SEAL_PENDING"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        {p.status === "SHOW_CAUSE_ISSUED" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionInProgress === p.noticeNumber}
                              onClick={() => handleAdjudicate(p, "SALARY_DEDUCTION_ENFORCED")}
                              className="h-8 px-2.5 rounded-lg text-rose-600 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold"
                              title="Enforce statutory salary deduction under RTS Act Section 10"
                            >
                              <UserX className="w-3.5 h-3.5 mr-1" />
                              <span>Enforce Debit</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionInProgress === p.noticeNumber}
                              onClick={() => handleAdjudicate(p, "FORCE_MAJEURE_EXCUSED")}
                              className="h-8 px-2.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs"
                              title="Excuse delay under legitimate force majeure exception"
                            >
                              <span>Excuse</span>
                            </Button>
                          </div>
                        ) : p.status === "SALARY_DEDUCTION_ENFORCED" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionInProgress === p.noticeNumber}
                            onClick={() => handleCompensateCitizen(p)}
                            className="h-8 px-2.5 rounded-lg text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-semibold"
                            title="Disburse statutory compensatory dividend directly to complainant"
                          >
                            <Coins className="w-3.5 h-3.5 mr-1" />
                            <span>Pay Citizen</span>
                          </Button>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Redressal Complete</span>
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
    </div>
  )
}
