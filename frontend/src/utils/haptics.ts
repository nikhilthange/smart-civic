/**
 * Haptic Vibration Feedback Utility for Mobile Web
 * Uses the Web Vibration API when supported on mobile devices.
 */

export const triggerHapticFeedback = (type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light") => {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return

  try {
    switch (type) {
      case "light":
        navigator.vibrate(10)
        break
      case "medium":
        navigator.vibrate(25)
        break
      case "heavy":
        navigator.vibrate(45)
        break
      case "success":
        navigator.vibrate([15, 40, 25])
        break
      case "warning":
        navigator.vibrate([30, 40, 30])
        break
      case "error":
        navigator.vibrate([50, 60, 50, 60])
        break
      default:
        navigator.vibrate(15)
    }
  } catch {
    // Graceful fallback if device policy disables vibration
  }
}
