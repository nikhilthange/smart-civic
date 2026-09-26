import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Share, RefreshCw } from "lucide-react"
import { usePWA } from "@/hooks/usePWA"
import { Button } from "@/components/ui/button"
import SmartCivicLogo from "@/components/common/SmartCivicLogo"

export function PWAInstallBanner() {
  const {
    canInstall,
    hasNativePrompt,
    isInstalled,
    isStandalone,
    isIOS,
    isDismissed,
    isUpdateAvailable,
    installApp,
    dismissPrompt,
    updateServiceWorker,
  } = usePWA()

  const [installing, setInstalling] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  // If already running standalone or installed, only show update if available
  if (isStandalone || isInstalled) {
    if (isUpdateAvailable) {
      return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] mx-auto p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex items-center justify-between gap-3 text-slate-900 dark:text-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <SmartCivicLogo size={24} className="w-6 h-6 shrink-0" animated={false} />
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">Update available</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Reload to apply latest changes</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={updateServiceWorker}
            className="h-8 px-3 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 shrink-0"
          >
            Reload
          </Button>
        </div>
      )
    }
    return null
  }

  // Hide if cannot install or dismissed
  if (!canInstall || isDismissed) {
    return null
  }

  const handleInstallClick = async () => {
    if (isIOS && !hasNativePrompt) {
      setShowIOSInstructions(true)
      return
    }

    setInstalling(true)
    try {
      await installApp()
    } finally {
      setInstalling(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Install Smart Civic App"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed bottom-20 md:bottom-6 right-3 md:right-6 left-3 md:left-auto md:w-[380px] z-50 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xl shadow-slate-900/10 dark:shadow-2xl dark:shadow-black/40 text-slate-900 dark:text-slate-100"
      >
        <div className="flex items-start gap-3.5">
          {/* App Icon */}
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center shrink-0 p-1.5 shadow-2xs">
            <SmartCivicLogo size={32} className="w-8 h-8" animated={false} />
          </div>

          {/* App Meta & Description */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                Smart Civic
              </h2>
              <button
                type="button"
                onClick={() => dismissPrompt(7)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 -mr-1 -mt-1 rounded-md transition-colors"
                title="Dismiss"
                aria-label="Close installation prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Mumbai Municipal Services
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-snug">
              Install the app for faster access, offline defect intake, and real-time status updates.
            </p>
          </div>
        </div>

        {/* iOS Step-by-Step Helper */}
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2"
          >
            <Share className="w-4 h-4 text-blue-500 shrink-0" />
            <p className="leading-tight">
              Tap <strong className="font-semibold">Share</strong> in Safari, then select <strong className="font-semibold">Add to Home Screen</strong>.
            </p>
          </motion.div>
        )}

        {/* Action Controls */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => dismissPrompt(7)}
            className="h-8 px-3 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Not now
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleInstallClick}
            disabled={installing}
            className="h-8 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            {installing ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Installing...</span>
              </span>
            ) : isIOS ? (
              "Add to Home Screen"
            ) : (
              "Install"
            )}
          </Button>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}

export default PWAInstallBanner
