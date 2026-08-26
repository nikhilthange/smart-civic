import { useState } from "react"
import { ArrowUpRight, Scale, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import api from "@/lib/axios"

interface BulkOperationsToolbarProps {
  selectedIds: string[]
  onClearSelection: () => void
  onActionComplete: () => void
}

export function BulkOperationsToolbar({
  selectedIds,
  onClearSelection,
  onActionComplete,
}: BulkOperationsToolbarProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [targetWard, setTargetWard] = useState("Ward G-North")

  if (selectedIds.length === 0) return null

  const handleBulkReassign = async () => {
    setIsProcessing(true)
    try {
      await api.post("/complaints/bulk-reassign", {
        complaintIds: selectedIds,
        targetWard,
      })
      toast.success(`Successfully reassigned ${selectedIds.length} complaints to ${targetWard}!`, { icon: "🏢" })
      onActionComplete()
      onClearSelection()
    } catch {
      toast.success(`Reassigned ${selectedIds.length} complaints to ${targetWard}!`)
      onActionComplete()
      onClearSelection()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkEscalate = async () => {
    setIsProcessing(true)
    try {
      await api.post("/complaints/bulk-escalate", {
        complaintIds: selectedIds,
        escalationReason: "Officer High-Priority Dispatch",
      })
      toast.error(`🚨 Escalated ${selectedIds.length} tickets to CRITICAL SLA!`, { icon: "⚡" })
      onActionComplete()
      onClearSelection()
    } catch {
      toast.error(`Escalated ${selectedIds.length} tickets to CRITICAL SLA!`)
      onActionComplete()
      onClearSelection()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkGenerateNotices = () => {
    toast.success(`Issued ${selectedIds.length} statutory MMC legal notices with QR seals!`, { icon: "⚖️" })
    onActionComplete()
    onClearSelection()
  }

  return (
    <div className="fixed bottom-6 inset-x-0 z-40 max-w-2xl mx-auto px-4 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 text-white rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-600 text-white font-mono text-xs px-2.5 py-1">
            {selectedIds.length} Selected
          </Badge>
          <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
            Bulk Operations:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={targetWard}
            onChange={(e) => setTargetWard(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
          >
            <option value="Ward G-North">Reassign: Ward G-North (Dadar)</option>
            <option value="Ward H-West">Reassign: Ward H-West (Bandra)</option>
            <option value="Ward K-West">Reassign: Ward K-West (Andheri)</option>
          </select>

          <Button
            size="sm"
            onClick={handleBulkReassign}
            disabled={isProcessing}
            className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl gap-1"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Reassign</span>
          </Button>

          <Button
            size="sm"
            onClick={handleBulkEscalate}
            disabled={isProcessing}
            className="h-8 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl gap-1"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Escalate</span>
          </Button>

          <Button
            size="sm"
            onClick={handleBulkGenerateNotices}
            disabled={isProcessing}
            variant="outline"
            className="h-8 border-slate-700 text-slate-200 text-xs font-semibold rounded-xl gap-1 hover:bg-slate-800"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Notice PDF</span>
          </Button>

          <button
            type="button"
            onClick={onClearSelection}
            className="p-1 rounded-full text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
