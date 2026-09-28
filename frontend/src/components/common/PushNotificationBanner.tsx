/**
 * PushNotificationBanner.tsx
 *
 * A beautiful, dismissible banner that prompts the user to enable
 * browser push notifications. Appears once per session after login,
 * only if permission hasn't been granted yet.
 */
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, X, Smartphone, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { requestFCMToken } from "@/lib/firebase"
import { notificationApi } from "@/services/notificationApi"
import toast from "react-hot-toast"

const DISMISSED_KEY = "smart_civic_push_dismissed"

export default function PushNotificationBanner() {
  const [visible, setVisible] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [granted, setGranted] = useState(false)
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Only show if notifications are supported, not yet granted, and not dismissed this session
    const alreadyDismissed = sessionStorage.getItem(DISMISSED_KEY) === "1"
    const supported = "Notification" in window && "serviceWorker" in navigator
    const notGranted = Notification.permission !== "granted"
    const notDenied  = Notification.permission !== "denied"

    if (supported && notGranted && notDenied && !alreadyDismissed) {
      // Small delay so it doesn't flash immediately on page load
      const timer = setTimeout(() => setVisible(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Clean up auto-hide timer on unmount
  useEffect(() => {
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current)
        autoHideTimerRef.current = null
      }
    }
  }, [])

  const handleEnable = async () => {
    setRequesting(true)
    try {
      const fcmToken = await requestFCMToken()
      if (fcmToken) {
        await notificationApi.saveFcmToken(fcmToken)
        setGranted(true)
        toast.success("🔔 Push notifications enabled!", { duration: 3000 })
        autoHideTimerRef.current = setTimeout(() => {
          setVisible(false)
          sessionStorage.setItem(DISMISSED_KEY, "1")
        }, 1800)
      } else if (Notification.permission === "denied") {
        toast.error("Notifications blocked. Enable them in browser settings.")
        dismiss()
      } else {
        toast("Push notifications not available on this device.", { icon: "ℹ️" })
        dismiss()
      }
    } catch {
      toast.error("Could not enable push notifications")
    } finally {
      setRequesting(false)
    }
  }

  const dismiss = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current)
      autoHideTimerRef.current = null
    }
    setVisible(false)
    sessionStorage.setItem(DISMISSED_KEY, "1")
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 340, damping: 26 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[min(96vw,440px)] pointer-events-auto"
        >
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden">
            {/* Gradient accent top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

            <div className="flex items-start gap-4 p-5">
              {/* Icon */}
              <div
                className={`p-3 rounded-2xl shrink-0 transition-colors ${
                  granted
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {granted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {granted ? "Notifications Enabled! ✅" : "Stay Informed on Your Grievances"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {granted
                    ? "You'll receive instant alerts when your complaint status changes."
                    : "Enable push notifications to get instant alerts when your complaint is updated, resolved, or assigned."}
                </p>

                {!granted && (
                  <div className="flex items-center gap-2 mt-3.5">
                    <Button
                      size="sm"
                      onClick={handleEnable}
                      disabled={requesting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8 text-xs font-semibold px-4 gap-1.5 shadow-sm"
                    >
                      {requesting ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Enabling…
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5" />
                          Enable Alerts
                        </span>
                      )}
                    </Button>
                    <button
                      onClick={dismiss}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Not now
                    </button>
                  </div>
                )}
              </div>

              {/* Close */}
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
