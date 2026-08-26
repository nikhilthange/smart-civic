import { useState, useEffect, useCallback } from "react"
import {
  ShieldCheck,
  RefreshCw,
  Lock,
  Layers,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import api from "@/lib/axios"

interface AuditLogEntry {
  _id?: string
  logId: string
  actionType: string
  actorId: string
  actorRole: string
  ward: string
  targetEntityId: string
  targetEntityType: string
  payloadSummary: string
  amountInr: number
  previousHash: string
  currentHash: string
  createdAt: string
}

export default function AuditLedger() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState("all")
  const [selectedAction, setSelectedAction] = useState("all")
  const [integrity, setIntegrity] = useState<{ isValid: boolean; verifiedCount?: number }>({ isValid: true })

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get("/audit/logs", {
        params: {
          ward: selectedWard !== "all" ? selectedWard : undefined,
          actionType: selectedAction !== "all" ? selectedAction : undefined,
        },
      })
      setLogs(res.data.logs || [])
      setIntegrity(res.data.integrity || { isValid: true })
    } catch {
      toast.error("Failed to load municipal audit ledger")
    } finally {
      setLoading(false)
    }
  }, [selectedWard, selectedAction])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-2 pb-12 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900/10 dark:bg-slate-100/10 text-slate-900 dark:text-white">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
              Tamper-Evident Municipal Audit Ledger
            </h1>
            <Badge className="bg-emerald-600 text-white font-mono text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>SHA-256 HASH CHAINED</span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Cryptographically sealed immutable log of all executive municipal actions, contractor escrow debits, stop-work injunctions, and transit pass allocations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold"
          >
            <option value="all">All Mumbai Wards</option>
            <option value="Ward G-North">Ward G-North (Dadar / Dharavi)</option>
            <option value="Ward H-West">Ward H-West (Bandra)</option>
            <option value="Ward K-West">Ward K-West (Andheri)</option>
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold"
          >
            <option value="all">All Municipal Actions</option>
            <option value="ESCROW_PENALTY_DEDUCTION">Escrow Penalty Deductions</option>
            <option value="STOP_WORK_INJUNCTION_ISSUED">Stop-Work Injunctions</option>
            <option value="TRANSIT_CAMP_ALLOCATION">Transit Camp Allocations</option>
          </select>

          <Button
            onClick={fetchLogs}
            variant="outline"
            size="sm"
            className="border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5 rounded-xl h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Verify Ledger</span>
          </Button>
        </div>
      </div>

      {/* Top 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Cryptographic Integrity
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <span>{integrity.isValid ? "100% VERIFIED" : "HASH INTEGRITY WARNING"}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Continuous block hash continuity</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Executive Actions Logged
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {logs.length} Transactions
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Immutable audit retention</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Total Penalty Recoveries
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
            ₹{logs.reduce((acc, curr) => acc + (curr.amountInr || 0), 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Contractor escrows & safety citations</p>
        </div>
      </div>

      {/* Audit Log Entries List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <span className="text-xs font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            Verified Municipal Transaction Block Stream
          </span>
          <span className="text-xs font-mono text-slate-400">SHA-256 Payload Hash</span>
        </div>

        {logs.map((l) => {
          return (
            <div key={l.logId} className="p-4 space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{l.logId}</span>
                  <Badge className="text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {l.actionType.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-xs text-slate-400 font-sans">• {l.ward}</span>
                </div>

                <div className="text-xs font-mono text-slate-400">
                  {new Date(l.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 font-sans">{l.payloadSummary}</p>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-[10px] font-mono text-slate-500 space-y-1">
                <div className="flex justify-between items-center">
                  <span>Target: <strong>{l.targetEntityId}</strong> ({l.targetEntityType})</span>
                  <span>Actor: {l.actorId} [{l.actorRole}]</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="truncate max-w-xs">Prev: {l.previousHash.slice(0, 24)}...</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-xs">
                    Hash: {l.currentHash.slice(0, 24)}...
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
