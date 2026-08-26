import { useState, useEffect } from "react"
import { WifiOff, Wifi, RefreshCw } from "lucide-react"

export function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowReconnected(true)
      const timer = setTimeout(() => {
        setShowReconnected(false)
      }, 4000)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowReconnected(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isOnline && !showReconnected) return null

  if (!isOnline) {
    return (
      <div className="w-full bg-slate-900 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs font-sans flex items-center justify-between shadow-md transition-all sticky top-0 z-50">
        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
          <div className="p-1 rounded bg-amber-500/20 text-amber-400">
            <WifiOff className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-white">Offline Mode Active:</span>
          <span className="text-slate-300 hidden sm:inline">
            You are disconnected from the network. Grievance reports and actions are cached in local storage and will sync automatically once reconnected.
          </span>
          <span className="text-slate-300 sm:hidden">
            Actions cached locally. Auto-sync on reconnect.
          </span>
          <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            LOCAL PWA CACHE
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-emerald-950/90 border-b border-emerald-500/30 text-emerald-300 px-4 py-2 text-xs font-sans flex items-center justify-between shadow-md transition-all sticky top-0 z-50 animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
        <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
          <Wifi className="w-3.5 h-3.5" />
        </div>
        <span className="font-semibold text-white">Connection Restored:</span>
        <span className="text-emerald-200">
          Synchronizing pending citizen reports & offline actions with Smart Civic cloud ledger...
        </span>
        <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
          <RefreshCw className="w-3 h-3 animate-spin" />
          SYNC COMPLETE
        </span>
      </div>
    </div>
  )
}
export default OfflineSyncBanner
