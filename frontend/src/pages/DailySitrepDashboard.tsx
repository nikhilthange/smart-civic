import { useState, useEffect } from "react"
import {
  Printer,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import api from "@/lib/axios"
import { useAuth } from "@/context/AuthContext"

interface SitrepData {
  reportId: string
  date: string
  reportingPeriod: string
  executiveSummary: {
    totalGrievancesIngested: number
    totalGrievancesResolved: number
    netResolutionVelocityPct: number
    averageResolutionHours: number
    criticalSlaBreaches: number
    citizenAppealsDisputed: number
    contractorEscrowFrozenInr: number
  }
  wardPerformanceBreakdown: {
    ward: string
    totalComplaints: number
    resolved: number
    compliancePct: number
    status: "GREEN" | "AMBER" | "RED"
  }[]
  monsoonAndDisasterTelemetry: {
    rainfallMax24hMm: number
    maxRainfallStation: string
    highTideTime: string
    swdPumpStationsActive: number
    subwaysWaterlogged: number
    subwayDetoursActive: number
  }
  auditAndFiscalEnforcement: {
    contractorStrikesIssuedToday: number
    activeDebarmentsCount: number
    propertyTaxRebatesApprovedInr: number
    greenBondCapExAllocatedInr: number
  }
  dutyOfficerSignature: string
}

export default function DailySitrepDashboard() {
  const { user } = useAuth()
  const [sitrep, setSitrep] = useState<SitrepData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const canSimulate = ["admin", "ward_officer", "superadmin", "officer"].includes(user?.role || "")

  const fetchSitrep = async () => {
    setIsLoading(true)
    try {
      const res = await api.get("/sitrep/daily")
      if (res.data.data) setSitrep(res.data.data)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSitrep()
  }, [])

  const handleExportPDF = () => {
    window.print()
    toast.success("Printing Municipal SITREP Briefing...", { icon: "📄" })
  }

  if (!sitrep) {
    return (
      <div className="p-8 text-center text-zinc-500 font-mono text-sm">
        Loading Municipal Situation Report...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0 print:space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-lg bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm print:border-none print:shadow-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Daily Situation Report (SITREP)
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              OFFICIAL BRIEFING
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            {sitrep.reportId} • {sitrep.date} ({sitrep.reportingPeriod})
          </p>
        </div>

        <div className="flex items-center gap-2.5 print:hidden">
          {canSimulate && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  toast.loading("Spawning dynamic live municipal events...", { id: "sim-live" })
                  const res = await api.post("/simulator/generate", { count: 3 })
                  toast.success(res.data.message || "Simulated 3 live incidents!", { id: "sim-live" })
                  fetchSitrep()
                } catch (err: any) {
                  const errMsg = err?.response?.data?.message || (err?.response?.status === 403 ? "Unauthorized: Admin privileges required" : "Simulation trigger failed")
                  toast.error(errMsg, { id: "sim-live" })
                }
              }}
              className="rounded-md text-xs gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            >
              <span>⚡ Spawn 3 Live Incidents</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSitrep}
            disabled={isLoading}
            className="rounded-md text-xs gap-1.5 border-zinc-200 dark:border-zinc-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportPDF}
            className="rounded-md bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 text-xs gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export SITREP (PDF)</span>
          </Button>
        </div>
      </div>

      {/* 24-Hour Velocity KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-lg bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm space-y-1">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
            Grievance Intake (24h)
          </span>
          <span className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono tabular-nums block">
            {sitrep.executiveSummary.totalGrievancesIngested}
          </span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">100% AI Triaged</span>
        </div>

        <div className="p-5 rounded-lg bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm space-y-1">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
            Resolved & Closed
          </span>
          <span className="text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono tabular-nums block">
            {sitrep.executiveSummary.totalGrievancesResolved}
          </span>
          <span className="text-xs text-zinc-500 font-mono tabular-nums">
            {sitrep.executiveSummary.netResolutionVelocityPct}% Net Velocity
          </span>
        </div>

        <div className="p-5 rounded-lg bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm space-y-1">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
            Mean Resolution Time
          </span>
          <span className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono tabular-nums block">
            {sitrep.executiveSummary.averageResolutionHours}h
          </span>
          <span className="text-xs text-zinc-500 font-mono">Target SLA: 24.0h</span>
        </div>

        <div className="p-5 rounded-lg bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm space-y-1">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
            Critical SLA Breaches
          </span>
          <span className="text-3xl font-semibold tracking-tight text-red-600 dark:text-red-400 font-mono tabular-nums block">
            {sitrep.executiveSummary.criticalSlaBreaches}
          </span>
          <span className="text-xs text-red-500 font-medium">Escalated to AMC HQ</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ward Performance Matrix */}
        <Card className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-lg shadow-sm">
          <CardHeader className="p-5 border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-base font-medium text-zinc-900 dark:text-zinc-100">
              Ward SLA Compliance Breakdown
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              24-hour compliance status across key administrative wards
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 uppercase font-medium border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Ward</th>
                    <th className="px-4 py-3 text-right">Intake</th>
                    <th className="px-4 py-3 text-right">Resolved</th>
                    <th className="px-4 py-3 text-right">Compliance</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/50">
                  {sitrep.wardPerformanceBreakdown.map((row) => (
                    <tr key={row.ward} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">{row.ward}</td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-300">{row.totalComplaints}</td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-300">{row.resolved}</td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">{row.compliancePct}%</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                          row.status === "GREEN"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : row.status === "AMBER"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            row.status === "GREEN" ? "bg-emerald-500" : row.status === "AMBER" ? "bg-amber-500" : "bg-red-500"
                          }`} />
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Monsoon & Flood Telemetry */}
        <Card className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-lg shadow-sm">
          <CardHeader className="p-5 border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-base font-medium text-zinc-900 dark:text-zinc-100">
              Monsoon & Disaster Telemetry
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Hydrological rainfall meters & critical flood subway status
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-medium">Peak 24h Rainfall</span>
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 font-mono tabular-nums mt-0.5">
                  {sitrep.monsoonAndDisasterTelemetry.rainfallMax24hMm} mm
                </p>
                <span className="text-[11px] text-zinc-500">{sitrep.monsoonAndDisasterTelemetry.maxRainfallStation}</span>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-medium">Arabian Sea High Tide</span>
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 font-mono tabular-nums mt-0.5">
                  {sitrep.monsoonAndDisasterTelemetry.highTideTime}
                </p>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Sluice Gates Operational</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
              <span>Duty Officer: {sitrep.dutyOfficerSignature}</span>
              <span className="font-mono">BMC Disaster Management HQ</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
