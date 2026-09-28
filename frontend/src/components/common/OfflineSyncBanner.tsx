import { useState, useEffect, useCallback } from "react"
import { WifiOff, Wifi, RefreshCw, UploadCloud, CheckCircle2 } from "lucide-react"
import {
  getPendingOfflineCount,
  syncAllOfflineData,
} from "@/utils/offlineQueue"

export function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  )
  const [pending, setPending] = useState(getPendingOfflineCount())
  const [isSyncing, setIsSyncing] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null)

  const handleManualSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return
    setIsSyncing(true)
    try {
      const result = await syncAllOfflineData()
      const total = result.complaintsSynced + result.resolutionsSynced
      if (total > 0) {
        setLastSyncResult(`Synced ${total} pending civic item(s)`)
      }
    } finally {
      setIsSyncing(false)
      setPending(getPendingOfflineCount())
    }
  }, [isSyncing])

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      setShowReconnected(true)
      setIsSyncing(true)

      try {
        const result = await syncAllOfflineData()
        const total = result.complaintsSynced + result.resolutionsSynced
        if (total > 0) {
          setLastSyncResult(`Successfully uploaded ${total} offline report(s)`)
        }
      } finally {
        setIsSyncing(false)
        setPending(getPendingOfflineCount())
      }

      const timer = setTimeout(() => {
        setShowReconnected(false)
        setLastSyncResult(null)
      }, 5000)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowReconnected(false)
      setPending(getPendingOfflineCount())
    }

    const handleQueueChange = () => {
      setPending(getPendingOfflineCount())
    }

    const handleSyncComplete = (e: any) => {
      setPending(getPendingOfflineCount())
      const { complaintsSynced, resolutionsSynced } = e.detail || {}
      const total = (complaintsSynced || 0) + (resolutionsSynced || 0)
      if (total > 0) {
        setLastSyncResult(`Synced ${total} civic item(s)`)
      }
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("smart_civic_offline_queue_changed", handleQueueChange)
    window.addEventListener("smart_civic_offline_sync_completed", handleSyncComplete)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("smart_civic_offline_queue_changed", handleQueueChange)
      window.removeEventListener("smart_civic_offline_sync_completed", handleSyncComplete)
    }
  }, [])

  // If online, not reconnecting, and no pending items, hide banner
  if (isOnline && !showReconnected && pending.total === 0) return null

  // Offline Mode Banner
  if (!isOnline) {
    return (
      <div className="w-full bg-slate-900 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs font-sans shadow-md transition-all sticky top-0 z-50">
        <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto w-full flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1 rounded bg-amber-500/20 text-amber-400 shrink-0">
              <WifiOff className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white shrink-0">Offline Mode:</span>
            <span className="text-slate-300 truncate text-[11px] sm:text-xs">
              {pending.total > 0
                ? `${pending.total} action(s) stored locally (${pending.complaints} grievance(s), ${pending.resolutions} worker proof(s)). Will auto-upload on reconnection.`
                : "You are disconnected from network. Reports are safely saved to local device cache."}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {pending.total > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                {pending.total} QUEUED
              </span>
            )}
            <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              PWA STORAGE
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Reconnection or Pending Items Banner (Online)
  return (
    <div className="w-full bg-emerald-950/95 border-b border-emerald-500/30 text-emerald-300 px-4 py-2 text-xs font-sans shadow-md transition-all sticky top-0 z-50 animate-in slide-in-from-top duration-200">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto w-full flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wifi className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="font-bold text-white shrink-0">
            {isSyncing ? "Syncing..." : "Connection Online:"}
          </span>
          <span className="text-emerald-200 truncate text-[11px] sm:text-xs">
            {lastSyncResult ||
              (pending.total > 0
                ? `${pending.total} offline item(s) pending sync with Smart Civic cloud ledger.`
                : "All offline data synchronized with municipal ledger.")}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {pending.total > 0 && !isSyncing && (
            <button
              onClick={handleManualSync}
              className="inline-flex items-center gap-1 font-sans text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-0.5 rounded font-semibold transition-colors shadow-sm"
            >
              <UploadCloud className="w-3 h-3" />
              Sync Now ({pending.total})
            </button>
          )}

          {isSyncing ? (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" />
              UPLOADING
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ONLINE
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default OfflineSyncBanner
