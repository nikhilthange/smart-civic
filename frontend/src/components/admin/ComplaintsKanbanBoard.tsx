import { useState } from "react"
import { type Complaint } from "@/services/complaintApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Clock,
  ArrowRight,
  MapPin,
  CheckCircle2,
} from "lucide-react"

interface ComplaintsKanbanBoardProps {
  complaints: Complaint[]
  onSelectComplaint?: (c: Complaint) => void
  onStatusChange?: (complaintId: string, newStatus: string) => void
}

const KANBAN_COLUMNS = [
  { id: "ai_triage", title: "AI Triage", statuses: ["pending", "submitted", "ai_verified"], color: "border-sky-500 bg-sky-50/40 dark:bg-sky-950/20" },
  { id: "ward_assigned", title: "Ward Assigned", statuses: ["assigned", "worker_assigned"], color: "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20" },
  { id: "in_progress", title: "Field In-Progress", statuses: ["in_progress"], color: "border-amber-500 bg-amber-50/40 dark:bg-amber-950/20" },
  { id: "proof_pending", title: "Proof Pending", statuses: ["resolved_pending_verification"], color: "border-purple-500 bg-purple-50/40 dark:bg-purple-950/20" },
  { id: "verified_closed", title: "Verified Closed", statuses: ["resolved", "closed"], color: "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20" },
]

export function ComplaintsKanbanBoard({
  complaints,
  onSelectComplaint,
  onStatusChange,
}: ComplaintsKanbanBoardProps) {
  const [movingId, setMovingId] = useState<string | null>(null)

  const handleAdvance = (c: Complaint, nextStatus: string) => {
    setMovingId(c._id)
    if (onStatusChange) {
      onStatusChange(c._id, nextStatus)
    }
    setTimeout(() => setMovingId(null), 400)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((col) => {
        const columnTickets = complaints.filter((c) =>
          col.statuses.includes(c.status)
        )

        return (
          <div
            key={col.id}
            className={`rounded-2xl border-t-4 ${col.color} border border-slate-200/80 dark:border-white/[0.08] p-3 flex flex-col h-[600px] shadow-sm`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="font-display font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                {col.title}
              </span>
              <Badge className="bg-slate-900/80 dark:bg-slate-800 text-white font-mono text-[10px] px-2 py-0">
                {columnTickets.length}
              </Badge>
            </div>

            {/* Column Card Stream */}
            <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1">
              {columnTickets.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-slate-400 text-xs italic font-sans text-center">
                  No tickets in {col.title}
                </div>
              ) : (
                columnTickets.map((c) => {
                  const isMoving = movingId === c._id

                  return (
                    <div
                      key={c._id}
                      onClick={() => onSelectComplaint?.(c)}
                      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2 group ${
                        isMoving ? "scale-95 opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-white truncate">
                          {c.complaintId || c._id.slice(0, 10)}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                            c.priority === "critical"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                              : c.priority === "high"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {c.priority || "medium"}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                        {c.title}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[100px]">{c.ward || "Mumbai"}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>4h SLA</span>
                        </span>
                      </div>

                      {/* Quick Move Action */}
                      <div className="pt-1 flex items-center justify-end gap-1">
                        {col.id === "ai_triage" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAdvance(c, "assigned")
                            }}
                            className="h-6 text-[10px] text-indigo-600 px-2 gap-1 rounded-lg hover:bg-indigo-50"
                          >
                            <span>Assign</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        )}
                        {col.id === "ward_assigned" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAdvance(c, "in_progress")
                            }}
                            className="h-6 text-[10px] text-amber-600 px-2 gap-1 rounded-lg hover:bg-amber-50"
                          >
                            <span>Dispatch</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        )}
                        {col.id === "in_progress" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAdvance(c, "resolved")
                            }}
                            className="h-6 text-[10px] text-emerald-600 px-2 gap-1 rounded-lg hover:bg-emerald-50"
                          >
                            <span>Resolve</span>
                            <CheckCircle2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
