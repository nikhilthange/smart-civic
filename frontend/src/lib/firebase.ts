/**
 * firebase.ts
 * Initialize Firebase app + Messaging for FCM push notifications.
 * All config values come from VITE_ env vars — fill them in .env
 */
import { initializeApp, getApps } from "firebase/app"
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging"

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// Only initialize once (Vite HMR re-runs this module)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Messaging is only available in browsers that support service workers
let messaging: Messaging | null = null
try {
  if (typeof window !== "undefined" && "serviceWorker" in navigator && firebaseConfig.apiKey !== "your_firebase_api_key") {
    messaging = getMessaging(app)
  }
} catch {
  // Silently skip on non-supported environments
}

export { messaging, getToken, onMessage }

/**
 * Request notification permission and get the FCM token.
 * Returns the token string or null if unavailable.
 */
export async function requestFCMToken(): Promise<string | null> {
  if (!messaging) return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return null

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    })
    return token || null
  } catch (err) {
    console.warn("FCM token error:", err)
    return null
  }
}
