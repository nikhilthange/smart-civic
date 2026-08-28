/**
 * ─── Service Worker Registration & Stale Cache Auto-Cleanup ───────────────────
 */

export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    // Immediately trigger update check on all active registrations
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.update().catch(() => {})
      }
    })

    if (import.meta.env.PROD) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("🚀 BMC Smart Civic Service Worker active:", reg.scope)

            // Auto-update check
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
    }
  }
}
