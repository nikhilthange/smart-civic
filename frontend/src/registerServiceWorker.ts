/**
 * ─── Service Worker Registration & Stale Cache Auto-Cleanup ───────────────────
 */

export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    // In local development, avoid caching issues with Vite HMR unless explicitly enabled
    if (import.meta.env.DEV && !localStorage.getItem("enable_dev_sw")) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {})
        }
      })
      return
    }

    // Immediately trigger update check on all active registrations
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.update().catch(() => {})
      }
    })

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("🚀 BMC Smart Civic Service Worker active:", reg.scope)

          // Auto-update check periodically
          reg.update().catch(() => {})

          // Background sync registration if supported
          if ("sync" in reg) {
            ;(reg as any).sync.register("sync-offline-civic-tickets").catch(() => {
              // Ignore if permission denied
            })
          }
        })
        .catch((err) => {
          console.warn("Service Worker registration failed:", err)
        })
    })

    // Listen for messages from SW (e.g. background sync triggers)
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SYNC_OFFLINE_QUEUE") {
        console.log("⚡ Service Worker triggered offline queue sync")
        window.dispatchEvent(new CustomEvent("smart_civic_sync_queue"))
      }
    })
  }
}
