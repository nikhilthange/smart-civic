import { useState, useEffect, useCallback } from "react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

const DISMISS_KEY = "smart_civic_pwa_dismissed"

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    // 1. Check if already installed / standalone
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://")

    setIsStandalone(standaloneMode)
    if (standaloneMode) {
      setIsInstalled(true)
    }

    // 2. Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream
    setIsIOS(iosDevice)

    // 3. Check dismissed state
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY)
      if (dismissedUntil) {
        const expiry = parseInt(dismissedUntil, 10)
        if (Date.now() < expiry) {
          setIsDismissed(true)
        } else {
          localStorage.removeItem(DISMISS_KEY)
        }
      }
    } catch {
      // ignore localStorage errors
    }

    // 4. Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
    }

    // 5. Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      setDeferredPrompt(null)
      try {
        localStorage.removeItem(DISMISS_KEY)
      } catch {}
    }

    // 6. Online / Offline listeners
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // 7. Check for service worker updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          setRegistration(reg)
          if (reg.waiting) {
            setIsUpdateAvailable(true)
          }
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true)
                }
              })
            }
          })
        }
      })
    }

    // 8. Listen for cross-component guidance requests
    const handleGuideRequest = () => {
      setIsDismissed(false)
      try {
        localStorage.removeItem(DISMISS_KEY)
      } catch {}
    }

    const handleDismissSync = () => {
      setIsDismissed(true)
    }

    window.addEventListener("smart_civic_open_install_guide", handleGuideRequest)
    window.addEventListener("smart_civic_pwa_dismissed", handleDismissSync)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("smart_civic_open_install_guide", handleGuideRequest)
      window.removeEventListener("smart_civic_pwa_dismissed", handleDismissSync)
    }
  }, [])

  const installApp = useCallback(async (): Promise<boolean> => {
    setIsDismissed(false)
    try {
      localStorage.removeItem(DISMISS_KEY)
    } catch {}

    if (!deferredPrompt) {
      // Broadcast to UI banner to display iOS or browser address-bar guidance
      window.dispatchEvent(
        new CustomEvent("smart_civic_open_install_guide", {
          detail: { isIOS }
        })
      )
      return false
    }

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true)
        setCanInstall(false)
        setDeferredPrompt(null)
        return true
      }
      return false
    } catch (err) {
      console.error("[PWA] Installation prompt failed:", err)
      return false
    }
  }, [deferredPrompt, isIOS])

  const dismissPrompt = useCallback((snoozeDays = 7) => {
    setIsDismissed(true)
    try {
      const expiry = Date.now() + snoozeDays * 24 * 60 * 60 * 1000
      localStorage.setItem(DISMISS_KEY, expiry.toString())
      window.dispatchEvent(new CustomEvent("smart_civic_pwa_dismissed"))
    } catch {}
  }, [])

  const updateServiceWorker = useCallback(() => {
    if (registration?.waiting) {
      // Reload once new service worker takes control
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => {
            window.location.reload()
          },
          { once: true }
        )
      }
      registration.waiting.postMessage({ type: "SKIP_WAITING" })
      // Fallback reload if controllerchange event doesn't fire within 600ms
      setTimeout(() => {
        window.location.reload()
      }, 600)
    }
  }, [registration])

  return {
    canInstall: (canInstall || (isIOS && !isStandalone)) && !isInstalled,
    hasNativePrompt: !!deferredPrompt,
    isInstalled,
    isStandalone,
    isIOS,
    isOnline,
    isDismissed,
    isUpdateAvailable,
    installApp,
    dismissPrompt,
    updateServiceWorker,
  }
}
