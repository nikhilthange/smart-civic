import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Cookie, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import analyticsService from "@/services/analyticsService"

const COOKIE_CONSENT_KEY = "smart_civic_cookie_consent"

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Small delay for smooth entry after initial page paint
      const timer = setTimeout(() => setIsVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "all")
    analyticsService.updateConsent(true)
    setIsVisible(false)
  }

  const handleEssentialOnly = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "essential")
    analyticsService.updateConsent(false)
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl text-slate-900 dark:text-slate-100"
        role="dialog"
        aria-label="Cookie Consent Banner"
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Cookie className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Civic Privacy & Cookie Notice</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">DPDP Act 2023 Compliant</p>
              </div>
            </div>
            <button
              onClick={handleEssentialOnly}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              aria-label="Dismiss cookie notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            We use essential storage to remember your authentication, language preferences, and offline triage data. Optional analytics help BMC ward supervisors monitor grievance dispatch response times.
          </p>

          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 text-[11px] space-y-1.5 text-slate-500 dark:text-slate-400"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Strictly Necessary</span>
                <span className="text-emerald-600 font-bold">Always Active</span>
              </div>
              <p>JWT session tokens, offline sync queue, and user interface preferences.</p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Civic Analytics</span>
                <span className="text-slate-400">Optional</span>
              </div>
              <p>Anonymized routing telemetry to detect slow municipal resolution clusters.</p>
            </motion.div>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>{showDetails ? "Hide Details" : "Preferences"}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showDetails ? "rotate-90" : ""}`} />
            </button>
            <Link to="/privacy" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">
              Privacy Policy
            </Link>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEssentialOnly}
              className="flex-1 text-xs h-9 rounded-xl"
            >
              Essential Only
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptAll}
              className="flex-1 text-xs h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              Accept All
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
