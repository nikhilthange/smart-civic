/**
 * ─── Service Worker Registration ──────────────────────────────────────────────
 */

export function registerServiceWorker() {
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("🚀 BMC Smart Civic Service Worker registered:", reg.scope)

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
